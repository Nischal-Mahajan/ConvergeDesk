from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from .models import Workspace, Membership, Project, Task
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from .models import WorkspaceInvitation, Membership
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from .models import Membership, WorkspaceInvitation
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Document
from .serializers import (
    WorkspaceSerializer,
    RegistrationSerializer,
    ProjectSerializer,
    TaskSerializer,
    WorkspaceMemberSerializer,
    AddWorkspaceMemberSerializer,
    UpdateWorkspaceMemberRoleSerializer,
    WorkspaceInvitationSerializer,
    DocumentSerializer,
)

User = get_user_model()

class WorkspaceListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workspace.objects.filter(
            memberships__user=self.request.user
        ).distinct()

    def perform_create(self, serializer):
        workspace = serializer.save(created_by=self.request.user)

        Membership.objects.create(
            workspace=workspace,
            user=self.request.user,
            role=Membership.Role.OWNER,
        )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            workspace__memberships__user=self.request.user
        ).select_related(
            "workspace", "created_by"
        ).distinct()

    def perform_create(self, serializer):
        workspace_id = serializer.validated_data["workspace"].id

        is_member = Membership.objects.filter(
            workspace_id=workspace_id,
            user=self.request.user,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You are not a member of this workspace."
            )

        serializer.save(created_by=self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            workspace__memberships__user=self.request.user
        ).select_related(
            "workspace",
            "created_by"
        ).distinct()

    def perform_update(self, serializer):
        project = self.get_object()

        # Check access to the target workspace too
        target_workspace = serializer.validated_data.get(
            "workspace",
            project.workspace
        )

        is_member = Membership.objects.filter(
            workspace=target_workspace,
            user=self.request.user
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You are not a member of this workspace."
            )

        serializer.save()

    
    def perform_destroy(self, instance):
        membership = Membership.objects.filter(
            workspace=instance.workspace,
            user=self.request.user
        ).first()

        if not membership or membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can delete projects."
            )

        instance.delete()



class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            "project",
            "project__workspace",
            "assigned_to",
            "created_by",
        ).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]

        is_member = Membership.objects.filter(
            workspace=project.workspace,
            user=self.request.user,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You are not a member of this project's workspace."
            )

        assigned_to = serializer.validated_data.get("assigned_to")

        if assigned_to:
            assignee_is_member = Membership.objects.filter(
                workspace=project.workspace,
                user=assigned_to,
            ).exists()

            if not assignee_is_member:
                raise PermissionDenied(
                    "The assigned user must be a workspace member."
                )

        serializer.save(created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            "project",
            "project__workspace",
            "assigned_to",
            "created_by",
        ).distinct()

    def perform_update(self, serializer):
        task = self.get_object()
        target_project = serializer.validated_data.get(
            "project",
            task.project,
        )

        is_member = Membership.objects.filter(
            workspace=target_project.workspace,
            user=self.request.user,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You are not a member of the target project's workspace."
            )

        assigned_to = serializer.validated_data.get(
            "assigned_to",
            task.assigned_to,
        )

        if assigned_to:
            assignee_is_member = Membership.objects.filter(
                workspace=target_project.workspace,
                user=assigned_to,
            ).exists()

            if not assignee_is_member:
                raise PermissionDenied(
                    "The assigned user must be a member of the target workspace."
                )

        serializer.save()

    def perform_destroy(self, instance):
        membership = Membership.objects.filter(
            workspace=instance.project.workspace,
            user=self.request.user,
        ).first()

        if not membership or (
            membership.role not in [
                Membership.Role.OWNER,
                Membership.Role.ADMIN,
            ]
            and instance.created_by_id != self.request.user.id
        ):
            raise PermissionDenied(
                "Only the task creator, workspace owners, or admins can delete tasks."
            )

        instance.delete()


class WorkspaceMemberListView(generics.ListAPIView):
    serializer_class = WorkspaceMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.kwargs["workspace_id"]

        is_member = Membership.objects.filter(
            workspace_id=workspace_id,
            user=self.request.user,
        ).exists()

        if not is_member:
            raise PermissionDenied(
                "You are not a member of this workspace."
            )

        return Membership.objects.filter(
            workspace_id=workspace_id
        ).select_related("user", "workspace")


class WorkspaceMemberCreateView(generics.GenericAPIView):
    serializer_class = AddWorkspaceMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_id):
        membership = Membership.objects.filter(
            workspace_id=workspace_id,
            user=request.user,
        ).first()

        if not membership or membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can add members."
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member_user = serializer.context["member_user"]

        membership, created = Membership.objects.get_or_create(
            workspace_id=workspace_id,
            user=member_user,
            defaults={"role": Membership.Role.MEMBER},
        )

        if not created:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"username": "This user is already a workspace member."}
            )

        return Response(
            WorkspaceMemberSerializer(membership).data,
            status=201,
        )


class WorkspaceInvitationCreateView(generics.GenericAPIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_id):
        membership = Membership.objects.filter(
            workspace_id=workspace_id,
            user=request.user,
        ).first()

        if not membership or membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can invite members."
            )

        email = request.data.get("email", "").strip().lower()
        print("INVITATION REQUEST DATA:", request.data)
        print("INVITATION EMAIL:", repr(request.data.get("email")))

        if not email:
            return Response(
                {"email": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"email": "Enter a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = membership.workspace

        existing_user = User.objects.filter(email__iexact=email).first()

        if existing_user and Membership.objects.filter(
            workspace=workspace,
            user=existing_user,
        ).exists():
            return Response(
                {"email": "This user is already a workspace member."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = WorkspaceInvitation.objects.filter(
            workspace=workspace,
            email__iexact=email,
            status=WorkspaceInvitation.Status.PENDING,
        ).first()

        if invitation and invitation.expires_at <= timezone.now():
            invitation.status = WorkspaceInvitation.Status.REVOKED
            invitation.save(update_fields=["status"])
            invitation = None

        if invitation:
            return Response(
                {"email": "A pending invitation already exists for this email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = WorkspaceInvitation.objects.create(
            workspace=workspace,
            email=email,
            invited_by=request.user,
        )

        invitation_url = (
            f"http://localhost:5176/accept-invitation/"
            f"{invitation.token}/"
        )

        try:
            send_mail(
                subject=f"Invitation to join {workspace.name} on ConvergeDesk",
                message=(
                    f"You have been invited to join {workspace.name} "
                    f"on ConvergeDesk.\n\n"
                    f"Accept your invitation here:\n{invitation_url}\n\n"
                    f"This invitation expires in 7 days."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            invitation.delete()
            return Response(
                {"detail": "Invitation email could not be sent."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": "Invitation email sent successfully.",
                "email": email,
                "workspace": workspace.name,
                "expires_at": invitation.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class WorkspaceInvitationAcceptView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        invitation = WorkspaceInvitation.objects.filter(
            token=token
        ).select_related("workspace").first()

        if not invitation:
            return Response(
                {"detail": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invitation.status != WorkspaceInvitation.Status.PENDING:
            return Response(
                {"detail": "This invitation is no longer pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.expires_at <= timezone.now():
            invitation.status = WorkspaceInvitation.Status.REVOKED
            invitation.save(update_fields=["status"])
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_email = (request.user.email or "").strip().lower()
        invited_email = invitation.email.strip().lower()

        if not user_email or user_email != invited_email:
            return Response(
                {
                    "detail": (
                        "Log in with the account registered "
                        "using the invited email address."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        membership, created = Membership.objects.get_or_create(
            workspace=invitation.workspace,
            user=request.user,
            defaults={"role": Membership.Role.MEMBER},
        )

        invitation.status = WorkspaceInvitation.Status.ACCEPTED
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["status", "accepted_at"])

        return Response(
            {
                "detail": "Invitation accepted successfully.",
                "workspace_id": invitation.workspace_id,
                "workspace_name": invitation.workspace.name,
                "role": membership.role,
                "membership_created": created,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceMemberRoleUpdateView(generics.GenericAPIView):
    serializer_class = UpdateWorkspaceMemberRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, workspace_id, member_id):
        requester_membership = get_object_or_404(
            Membership,
            workspace_id=workspace_id,
            user=request.user,
        )

        if requester_membership.role != Membership.Role.OWNER:
            raise PermissionDenied(
                "Only the workspace owner can change member roles."
            )

        target_membership = get_object_or_404(
            Membership.objects.select_related("user", "workspace"),
            workspace_id=workspace_id,
            id=member_id,
        )

        if target_membership.role == Membership.Role.OWNER:
            raise ValidationError(
                {"detail": "The owner's role cannot be changed."}
            )

        serializer = self.get_serializer(
            target_membership,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            WorkspaceMemberSerializer(target_membership).data,
            status=status.HTTP_200_OK,
        )


class WorkspaceMemberDeleteView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, workspace_id, member_id):
        requester_membership = get_object_or_404(
            Membership,
            workspace_id=workspace_id,
            user=request.user,
        )

        if requester_membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can remove members."
            )

        target_membership = get_object_or_404(
            Membership,
            workspace_id=workspace_id,
            id=member_id,
        )

        if target_membership.role == Membership.Role.OWNER:
            raise PermissionDenied(
                "The workspace owner cannot be removed."
            )

        if (
            requester_membership.role == Membership.Role.ADMIN
            and target_membership.role == Membership.Role.ADMIN
        ):
            raise PermissionDenied(
                "Admins cannot remove other admins."
            )

        target_membership.delete()

        return Response(
            {"detail": "Member removed from workspace successfully."},
            status=status.HTTP_200_OK,
        )



class WorkspaceInvitationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceInvitationSerializer
    
    def get_queryset(self):
        workspace_id = self.kwargs["workspace_id"]

        membership = get_object_or_404(
            Membership,
            workspace_id=workspace_id,
            user=self.request.user,
        )

        if membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can view invitations."
            )

        # Mark expired pending invitations as revoked.
        WorkspaceInvitation.objects.filter(
            workspace_id=workspace_id,
            status=WorkspaceInvitation.Status.PENDING,
            expires_at__lte=timezone.now(),
        ).update(status=WorkspaceInvitation.Status.REVOKED)

        return WorkspaceInvitation.objects.filter(
            workspace_id=workspace_id,
            status=WorkspaceInvitation.Status.PENDING,
        ).select_related("invited_by", "workspace")


class WorkspaceInvitationRevokeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_id, invitation_id):
        membership = get_object_or_404(
            Membership,
            workspace_id=workspace_id,
            user=request.user,
        )

        if membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace owners and admins can revoke invitations."
            )

        invitation = get_object_or_404(
            WorkspaceInvitation,
            id=invitation_id,
            workspace_id=workspace_id,
        )

        if invitation.status != WorkspaceInvitation.Status.PENDING:
            return Response(
                {"detail": "Only pending invitations can be revoked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.status = WorkspaceInvitation.Status.REVOKED
        invitation.save(update_fields=["status"])

        return Response(
            {"detail": "Invitation revoked successfully."},
            status=status.HTTP_200_OK,
        )



class ProjectDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_project(self):
        return get_object_or_404(
            Project.objects.filter(
                workspace__memberships__user=self.request.user
            ).distinct(),
            pk=self.kwargs["project_id"]
        )

    def get_queryset(self):
        return Document.objects.filter(
            project_id=self.kwargs["project_id"],
            project__workspace__memberships__user=self.request.user
        ).select_related(
            "project", "created_by"
        ).distinct()

    def list(self, request, *args, **kwargs):
        self.get_project()
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        project = self.get_project()
        serializer.save(
            project=project,
            created_by=self.request.user
        )


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            "project", "project__workspace", "created_by"
        ).distinct()

    def perform_destroy(self, instance):
        membership = Membership.objects.filter(
            workspace=instance.project.workspace,
            user=self.request.user
        ).first()

        if not membership:
            raise PermissionDenied(
                "You do not have access to this document."
            )

        if (
            membership.role not in [
                Membership.Role.OWNER,
                Membership.Role.ADMIN,
            ]
            and instance.created_by_id != self.request.user.id
        ):
            raise PermissionDenied(
                "Only the document creator, workspace owners, "
                "or admins can delete documents."
            )

        instance.delete()



class CollaborationAuthorizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = get_object_or_404(
            Document.objects.filter(
                project__workspace__memberships__user=request.user
            ).distinct(),
            pk=pk,
        )

        return Response({
            "authorized": True,
            "document_id": document.id,
            "project_id": document.project_id,
        })
