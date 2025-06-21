'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface Member {
  id: number;
  name: string;
  email: string;
  rel_type: string;
  gender: number;
  birthday: string;
  flag: number;
}

const genderMap: Record<number, string> = {
  0: 'Unknown',
  1: 'Male',
  2: 'Female',
};

const statusMap: Record<number, string> = {
  0: 'Active',
  1: 'Disabled',
};

const defaultMember: Partial<Member> = {
  name: '',
  email: '',
  rel_type: '',
  gender: 0,
  birthday: '',
  flag: 0,
};

// 关系类型字典
const relTypeOptions = [
  { value: "100", label: 'Child' },
  { value: "101", label: 'Relative' },
  { value: "200", label: 'Friend' },
  { value: "900", label: 'Other' },
];

const genderOptions = [
  { value: 0, label: 'Unknown' },
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
];

// 添加成员表单校验
const memberSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  gender: yup.number().oneOf([0, 1, 2]).required('Gender is required'),
  rel_type: yup.string().oneOf(["100", "101", "200", "900"]).required('Relationship is required'),
  birthday: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in yyyy-MM-dd format').nullable(),
  email: yup.string().email('Invalid email').nullable(),
  rel_desc: yup.string().nullable(),
  personality: yup.string().nullable(),
  character: yup.string().nullable(),
});

interface MemberListProps {
  onLoading: (loading: boolean) => void;
}

export default function MemberList({ onLoading }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(memberSchema),
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    onLoading(true);
    try {
      const res = await apiClient.post('/spwapi/auth/profile/member/list');
      if (res && res.code === 0) {
        setMembers(res.data || []);
      } else {
        toast.error(res?.msg || 'Failed to fetch members');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch members');
    } finally {
      onLoading(false);
    }
  };

  const handleAdd = () => {
    reset({
      id: undefined,
      name: '',
      gender: 0,
      rel_type: "100",
      birthday: '',
      email: '',
      rel_desc: '',
      personality: '',
      character: '',
    });
    setShowModal(true);
  };

  const handleEdit = (member: any) => {
    reset({
      ...member,
      rel_type: String(member.rel_type ?? "100"),
      gender: member.gender ?? 0,
      birthday: member.birthday?.split('T')[0] || '', // Format date
    });
    setShowModal(true);
  };

  const handleDeleteClick = (member: Member) => {
    setDeleteTarget(member);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/profile/member/del', { member_id: deleteTarget.id });
      if (res && res.code === 0) {
        toast.success('Deleted successfully');
        setMembers(members => members.filter(m => m.id !== deleteTarget.id));
        setShowDeleteModal(false);
      } else {
        toast.error(res?.msg || 'Delete failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const res = await apiClient.post('/spwapi/auth/profile/member/add', data);
      if (res && res.code === 0) {
        toast.success(data.id ? 'Member updated successfully' : 'Member added successfully');
        setShowModal(false);
        fetchMembers();
      } else {
        toast.error(res?.msg || 'Operation failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
    }
  };

  const inputStyle = "w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Member Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
        >
          Add Member
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Relationship</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Gender</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Birthday</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{member.name}</td>
                <td className="py-3 px-4">{member.email}</td>
                <td className="py-3 px-4">{relTypeOptions.find(o => o.value === String(member.rel_type))?.label || member.rel_type}</td>
                <td className="py-3 px-4">{genderMap[member.gender] || 'Unknown'}</td>
                <td className="py-3 px-4">{member.birthday?.split('T')[0]}</td>
                <td className="py-3 px-4">{statusMap[member.flag] || 'Unknown'}</td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:underline font-medium mr-4" onClick={() => handleEdit(member)}>Edit</button>
                  <button
                    className="text-red-500 hover:underline font-medium"
                    onClick={() => handleDeleteClick(member)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
            <h3 className="text-2xl font-bold mb-6">{errors.id ? 'Edit Member' : 'Add Member'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('id')} />
              <div>
                <label className={labelStyle}>Name<span className="text-red-500">*</span></label>
                <input type="text" {...register('name')} className={inputStyle} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
              <div>
                <label className={labelStyle}>Gender<span className="text-red-500">*</span></label>
                <select {...register('gender')} className={inputStyle}>
                  {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
              </div>
              <div>
                <label className={labelStyle}>Relationship<span className="text-red-500">*</span></label>
                <select {...register('rel_type')} className={inputStyle}>
                  {relTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {errors.rel_type && <p className="text-red-500 text-xs mt-1">{errors.rel_type.message as string}</p>}
              </div>
              <div>
                <label className={labelStyle}>Birthday</label>
                <input type="date" {...register('birthday')} className={inputStyle} />
                {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday.message as string}</p>}
              </div>
              <div>
                <label className={labelStyle}>Email</label>
                <input type="email" {...register('email')} className={inputStyle} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center" disabled={isSubmitting}>
                  {isSubmitting && <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
            <h3 className="text-2xl font-bold mb-4">Delete Member</h3>
            <p className="mb-6 text-gray-600">Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center" onClick={handleConfirmDelete} disabled={deleteLoading}>
                {deleteLoading && <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 