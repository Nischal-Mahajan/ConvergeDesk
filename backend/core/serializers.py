from rest_framework import serializers
from .models import Workspace
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Project
from .models import Task
from .models import Membership
from .models import WorkspaceInvitation
from .models import Document
from .models import Whiteboard

class WorkspaceSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(
        max_length=120,
        required=False
    )
    class Meta:
        model = Workspace
        fields = ["id", "name", "slug", "created_by", "created_at"]
        read_only_fields = ["id", "created_by", "created_at"]




User = get_user_model()



class RegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Email is required."
            )

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)




class ProjectSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "name",
            "description",
            "status",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        default=None
    )
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "assigned_to",
            "assigned_to_username",
            "due_date",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_username",
            "assigned_to_username",
            "created_at",
            "updated_at",
        ]


User = get_user_model()


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    class Meta:
        model = Membership
        fields = [
            "id",
            "workspace",
            "user",
            "username",
            "email",
            "role",
            "joined_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "user",
            "username",
            "email",
            "role",
            "joined_at",
        ]

class AddWorkspaceMemberSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No user found with this username."
            )

        self.context["member_user"] = user
        return value

class UpdateWorkspaceMemberRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["role"]

    def validate_role(self, value):
        if value not in [
            Membership.Role.ADMIN,
            Membership.Role.MEMBER,
        ]:
            raise serializers.ValidationError(
                "Role must be ADMIN or MEMBER."
            )

        return value


class WorkspaceInvitationSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(
        source="invited_by.username",
        read_only=True,
    )

    class Meta:
        model = WorkspaceInvitation
        fields = [
            "id",
            "workspace",
            "email",
            "invited_by_username",
            "status",
            "expires_at",
            "created_at",
        ]
        read_only_fields = fields



class DocumentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Document
        fields = [
            "id",
            "project",
            "title",
            "content",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]



class WhiteboardSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = Whiteboard
        fields = [
            "id",
            "project",
            "title",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]

