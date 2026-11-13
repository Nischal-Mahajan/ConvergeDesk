from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class RegistrationTests(APITestCase):
    def setUp(self):
        self.url = "/api/register/"
        self.valid_data = {
            "username": "test_signup_user",
            "email": "signup@example.com",
            "password": "StrongTestPassword!927"
        }

    def test_registration_success(self):
        response = self.client.post(
            self.url, self.valid_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="test_signup_user").exists()
        )
        self.assertNotIn("password", response.data)

    def test_email_is_required(self):
        data = self.valid_data.copy()
        data.pop("email")

        response = self.client.post(
            self.url, data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing_user",
            email="signup@example.com",
            password="AnotherStrongPassword!927"
        )

        response = self.client.post(
            self.url, self.valid_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_is_hashed(self):
        self.client.post(
            self.url, self.valid_data, format="json"
        )

        user = User.objects.get(username="test_signup_user")
        self.assertNotEqual(user.password, self.valid_data["password"])
        self.assertTrue(user.check_password(self.valid_data["password"]))


class WhiteboardTests(APITestCase):
    def setUp(self):
        from .models import Workspace, Membership, Project, Whiteboard, WhiteboardState

        self.user = User.objects.create_user(
            username="board_owner",
            email="owner@example.com",
            password="StrongPassword!123"
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@example.com",
            password="StrongPassword!123"
        )
        self.workspace = Workspace.objects.create(
            name="Test Whiteboard Workspace",
            created_by=self.user
        )
        Membership.objects.create(
            workspace=self.workspace,
            user=self.user,
            role=Membership.Role.OWNER
        )
        self.project = Project.objects.create(
            workspace=self.workspace,
            name="Architecture Project",
            created_by=self.user
        )
        self.board = Whiteboard.objects.create(
            project=self.project,
            title="Sprint Planning Board",
            created_by=self.user
        )

    def test_list_whiteboards_authorized(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/projects/{self.project.id}/whiteboards/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Sprint Planning Board")

    def test_create_whiteboard_authorized(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/projects/{self.project.id}/whiteboards/"
        response = self.client.post(url, {"title": "System Architecture"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "System Architecture")
        self.assertEqual(response.data["created_by"], self.user.id)

    def test_unauthenticated_cannot_access(self):
        url = f"/api/projects/{self.project.id}/whiteboards/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_member_cannot_access(self):
        self.client.force_authenticate(user=self.other_user)
        url = f"/api/projects/{self.project.id}/whiteboards/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rename_whiteboard(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/whiteboards/{self.board.id}/"
        response = self.client.patch(url, {"title": "Renamed Board"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Renamed Board")

    def test_delete_whiteboard(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/whiteboards/{self.board.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_collaboration_authorize(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/collaboration/whiteboards/{self.board.id}/authorize/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["authorized"])
        self.assertEqual(response.data["whiteboard_id"], self.board.id)

    def test_collaboration_authorize_non_member_denied(self):
        self.client.force_authenticate(user=self.other_user)
        url = f"/api/collaboration/whiteboards/{self.board.id}/authorize/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

