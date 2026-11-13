import React, { useState } from 'react';
import { UserAccount } from '../types';
import { UserFormValues } from '../components/users/UserFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DEFAULT_USER_FORM: UserFormValues = {
  username: '',
  password: '1234',
  name: '',
  email: '',
  role: 'SF_1',
  department: 'Sales & Business Development',
  skills: [],
  extension: '',
  status: 'active',
  avatarBg: '#CFE2F8',
  mustChangePassword: false,
};

export const useUserManagementModals = () => {
  const { createUser, updateUser, deleteUser, resetPassword, toggleUserStatus, toggleTwoFactor } = useAuth();
  const { showToast } = useToast();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userForTwoFactor, setUserForTwoFactor] = useState<UserAccount | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState<UserFormValues>(DEFAULT_USER_FORM);
  const [newPasswordInput, setNewPasswordInput] = useState('1234');
  const [resetMustChange, setResetMustChange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setFormData(DEFAULT_USER_FORM);
    setModalMode('create');
  };

  const openEdit = (u: UserAccount) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      password: u.password,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      skills: u.skills ?? [],
      extension: u.extension ?? '',
      status: u.status,
      avatarBg: u.avatarBg || '#CFE2F8',
      mustChangePassword: false,
    });
    setModalMode('edit');
  };

  const openResetPassword = (u: UserAccount) => {
    setSelectedUser(u);
    setNewPasswordInput('1234');
    setResetMustChange(false);
    setIsResetModalOpen(true);
  };

  const openDelete = (u: UserAccount) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.name.trim()) return;
    setIsSubmitting(true);
    const res =
      modalMode === 'create'
        ? await createUser(formData)
        : selectedUser
          ? await updateUser(selectedUser.id, formData)
          : { success: false, error: 'ไม่พบผู้ใช้ที่เลือก' };
    setIsSubmitting(false);
    if (!res.success) return showToast(res.error || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    showToast(
      modalMode === 'create'
        ? `สร้างผู้ใช้ "${formData.username.trim()}" เรียบร้อยแล้ว`
        : `แก้ไขข้อมูลผู้ใช้ "${formData.username.trim()}" เรียบร้อย`,
      'success'
    );
    setModalMode(null);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordInput.trim()) return;
    setIsSubmitting(true);
    const res = await resetPassword(selectedUser.id, newPasswordInput.trim(), resetMustChange);
    setIsSubmitting(false);
    if (!res.success) return showToast(res.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
    showToast(`รีเซ็ตรหัสผ่านของ "${selectedUser.username}" เรียบร้อยแล้ว`, 'success');
    setIsResetModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const res = await deleteUser(selectedUser.id);
    setIsSubmitting(false);
    if (!res.success) return showToast(res.error || 'ไม่สามารถลบผู้ใช้ได้', 'error');
    showToast(`ลบผู้ใช้ "${selectedUser.username}" เรียบร้อย`, 'success');
    setIsDeleteModalOpen(false);
  };

  const handleToggleStatus = async (u: UserAccount) => {
    const res = await toggleUserStatus(u.id);
    if (!res.success) showToast(res.error || 'เปลี่ยนสถานะไม่สำเร็จ', 'error');
  };

  const handleToggleTwoFactor = async (u: UserAccount) => {
    if (!u.twoFactorEnabled) return setUserForTwoFactor(u);
    const res = await toggleTwoFactor(u.id, false);
    if (res.success) showToast(`ปิดการใช้งาน 2FA สำหรับ ${u.username} แล้ว`, 'info');
    else showToast(res.error || 'ไม่สามารถปิด 2FA ได้', 'error');
  };

  return {
    modalMode, setModalMode, isResetModalOpen, setIsResetModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
    userForTwoFactor, setUserForTwoFactor, selectedUser, formData, setFormData,
    newPasswordInput, setNewPasswordInput, resetMustChange, setResetMustChange, isSubmitting,
    openCreate, openEdit, openResetPassword, openDelete,
    handleFormSubmit, handleResetSubmit, handleDeleteConfirm, handleToggleStatus, handleToggleTwoFactor,
  };
};
