import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api';

export default function EmployeeProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rawName = (user?.name as string) || (user?.full_name as string) || 'Employee';
  const userEmail = (user?.email as string) || 'employee@company.com';
  const userRole = (user?.role as string)?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Employee';
  const userPhone = (user?.phone as string) || 'Not provided';
  const userDepartment = (user?.department as string) || (user?.team as string) || (user?.department_name as string) || 'N/A';
  const userJoinDate = user?.created_at && typeof user.created_at === 'string'
    ? new Date(user.created_at).toLocaleDateString()
    : user?.joined_at && typeof user.joined_at === 'string'
      ? new Date(user.joined_at).toLocaleDateString()
      : 'N/A';
  const userLocation = (user?.location as string) || 'Chennai, India';

  const capitalise = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());
  const displayName = capitalise(rawName);
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const infoRows = [
    { label: 'Full Name', value: displayName, icon: 'person-outline' },
    { label: 'Email', value: userEmail, icon: 'mail-outline' },
    { label: 'Phone', value: userPhone, icon: 'call-outline' },
    { label: 'Department', value: userDepartment, icon: 'briefcase-outline' },
    { label: 'Member Since', value: userJoinDate, icon: 'calendar-outline' },
    { label: 'Location', value: userLocation, icon: 'location-outline' },
  ];

  const handlePasswordChange = async () => {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('New password must be different from your current password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });

      alert(
        response.data?.message ||
        'Password changed successfully!'
      );

      setShowPasswordModal(false);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('Change password error:', error);

      alert(
        error?.message ||
        'Failed to change password. Please try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const response = await api.post('/users/delete-account');
      const successMessage =
        response?.data?.message ||
        'Your account has been deactivated successfully. Login access is now revoked.';

      setShowDeleteModal(false);
      alert(successMessage);

      // Log out and navigate back to login screen
      await logout();
      router.replace('/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete account. Please try again or contact your administrator.';
      alert(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* ── FIXED ORANGE HEADER ── */}
      <View
        style={{
          backgroundColor: '#f97316',
          paddingTop: 56,
          paddingBottom: 16,
          paddingHorizontal: 20,
          zIndex: 10,
        }}
      >
        {/* Back + Edit row */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-black text-lg">Profile</Text>
          <TouchableOpacity className="w-9 h-9 bg-white/20 rounded-full items-center justify-center">
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── ORANGE BACKGROUND EXTENSION ── */}
        <View style={{ backgroundColor: '#f97316', height: 80 }} />

        {/* ── AVATAR (overlapping banner) ── */}
        <View className="items-center" style={{ marginTop: -60 }}>
          <View className="relative">
            <View
              className="w-28 h-28 rounded-full bg-white items-center justify-center border-4 border-white"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <View className="w-24 h-24 rounded-full bg-slate-800 items-center justify-center">
                <Text className="text-4xl font-black text-white">{avatarLetter}</Text>
              </View>
            </View>
            {/* Camera Edit Badge */}
            <TouchableOpacity
              className="absolute bottom-1 right-1 w-8 h-8 bg-orange-500 rounded-full items-center justify-center border-2 border-white"
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-900 font-black text-2xl mt-4 mb-1">{displayName}</Text>
          <Text className="text-slate-500 text-sm mb-3">{userEmail}</Text>
          <View className="bg-slate-100 px-4 py-1.5 rounded-full">
            <Text className="text-slate-700 font-semibold text-xs">{userRole}</Text>
          </View>
        </View>

        {/* ── PERSONAL INFORMATION CARD ── */}
        <View className="mx-5 mb-5 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
          <Text className="text-slate-800 font-bold text-base px-5 pt-5 pb-3">Personal Information</Text>
          {infoRows.map((row, idx) => (
            <View
              key={idx}
              className={`flex-row items-center px-5 py-4 ${idx !== infoRows.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-8 h-8 bg-orange-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name={row.icon as any} size={16} color="#f97316" />
              </View>
              <Text className="text-slate-500 text-sm flex-1">{row.label}</Text>
              <Text className="text-slate-800 font-semibold text-sm">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ── EDIT PROFILE BUTTON ── */}
        <View className="mx-5 mb-4">
          <TouchableOpacity
            className="bg-orange-500 rounded-2xl py-4 items-center justify-center shadow-sm"
            style={{
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text className="text-white font-black text-base">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-5 mb-4">
          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            className="bg-white border border-orange-200 rounded-2xl py-4 items-center justify-center flex-row"
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#f97316"
            />

            <Text className="text-orange-500 font-bold text-sm ml-2">
              Change Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT BUTTON ── */}
        <View className="mx-5 mb-4">
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            className="border border-slate-200 bg-white rounded-2xl py-4 items-center justify-center flex-row shadow-sm"
          >
            <Ionicons name="log-out-outline" size={18} color="#64748b" />
            <Text className="text-slate-700 font-bold text-sm ml-2">Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* ── DELETE ACCOUNT BUTTON ── */}
        <View className="mx-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDeleteModal(true)}
            className="border border-red-200 bg-red-50 rounded-2xl py-4 items-center justify-center flex-row shadow-sm"
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm ml-2">Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      {showPasswordModal && (
        <View
          className="absolute inset-0 bg-black/60 items-center justify-center px-5"
          style={{ zIndex: 100 }}
        >
          <View className="w-full bg-white rounded-3xl overflow-hidden">

            {/* Header */}
            <View className="bg-orange-500 px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#fff"
                />

                <Text className="text-white font-black text-lg ml-2">
                  Change Password
                </Text>
              </View>

              <TouchableOpacity
                disabled={isChangingPassword}
                onPress={() => {
                  setShowPasswordModal(false);

                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });

                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View className="p-5">

              {/* Current Password */}
              <Text className="text-slate-700 font-semibold text-sm mb-2">
                Current Password
              </Text>

              <View className="flex-row items-center border border-slate-200 rounded-xl px-3 mb-4">
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#94a3b8"
                />

                <TextInput
                  className="flex-1 text-slate-900 py-3 px-3"
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showCurrentPassword}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: text,
                    })
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                >
                  <Ionicons
                    name={
                      showCurrentPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text className="text-slate-700 font-semibold text-sm mb-2">
                New Password
              </Text>

              <View className="flex-row items-center border border-slate-200 rounded-xl px-3 mb-4">
                <Ionicons
                  name="key-outline"
                  size={18}
                  color="#94a3b8"
                />

                <TextInput
                  className="flex-1 text-slate-900 py-3 px-3"
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showNewPassword}
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: text,
                    })
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                >
                  <Ionicons
                    name={
                      showNewPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text className="text-slate-700 font-semibold text-sm mb-2">
                Confirm New Password
              </Text>

              <View className="flex-row items-center border border-slate-200 rounded-xl px-3 mb-6">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#94a3b8"
                />

                <TextInput
                  className="flex-1 text-slate-900 py-3 px-3"
                  placeholder="Confirm new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: text,
                    })
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3">

                <TouchableOpacity
                  disabled={isChangingPassword}
                  onPress={() => {
                    setShowPasswordModal(false);

                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="flex-1 border border-slate-200 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-slate-600 font-bold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isChangingPassword}
                  onPress={handlePasswordChange}
                  className="flex-1 bg-orange-500 rounded-xl py-3.5 items-center"
                >
                  {isChangingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>

              </View>

            </View>
          </View>
        </View>
      )}

      {/* ── CUSTOMIZED DELETE ACCOUNT CONFIRMATION MODAL ── */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          if (!isDeleting) setShowDeleteModal(false);
        }}
      >
        <View className="flex-1 bg-black/75 items-center justify-center px-5">
          <View
            className="w-full max-w-md bg-[#0f1117] rounded-3xl overflow-hidden border border-white/10"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 20,
            }}
          >
            {/* Top Red Accent Bar */}
            <View style={{ height: 6, width: '100%', backgroundColor: '#e11d48' }} />

            <View className="p-6">
              {/* Header Icon + Title */}
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 items-center justify-center mr-3">
                    <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-black text-lg">
                      Delete Account?
                    </Text>
                    <Text className="text-white/50 text-xs mt-0.5">
                      Deactivate and revoke portal access
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isDeleting}
                  onPress={() => setShowDeleteModal(false)}
                  className="p-1 rounded-full bg-white/5"
                >
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* User Details Summary Card */}
              <View className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 mb-4">
                <View className="flex-row items-center justify-between pb-3 border-b border-white/5 mb-3">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 items-center justify-center mr-2.5">
                      <Text className="text-orange-400 font-black text-sm">
                        {avatarLetter}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text className="text-white/40 text-xs" numberOfLines={1}>
                        {userEmail}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                    <Text className="text-emerald-300 font-bold text-[10px]">
                      {userRole}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center text-xs">
                  <View>
                    <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                      Current Status
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                      <Text className="text-emerald-400 font-bold text-xs">
                        Active
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                      New Status
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View className="w-2 h-2 rounded-full bg-rose-400 mr-1.5" />
                      <Text className="text-rose-400 font-bold text-xs">
                        Inactive (Blocked)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contextual Warning Box */}
              <View className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3.5 mb-5">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="shield-outline" size={15} color="#fb7185" />
                  <Text className="text-rose-200 font-bold text-xs ml-1.5">
                    Login Access Will Be Revoked
                  </Text>
                </View>
                <Text className="text-rose-300/80 text-xs leading-5">
                  Deactivating this account will immediately revoke all portal login permissions. Any active session will end, and you will not be able to log back in.
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  disabled={isDeleting}
                  onPress={() => setShowDeleteModal(false)}
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-white/80 font-bold text-sm">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isDeleting}
                  onPress={handleDeleteAccount}
                  className="flex-1 bg-rose-600 rounded-xl py-3.5 items-center justify-center flex-row shadow-lg"
                  style={{
                    shadowColor: '#e11d48',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  {isDeleting ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-bold text-sm ml-2">
                        Deleting...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                      <Text className="text-white font-bold text-sm ml-1.5">
                        Yes, Delete
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
