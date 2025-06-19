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
  birthday: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in yyyy-MM-dd format'),
  email: yup.string().email('Invalid email').nullable(),
  rel_desc: yup.string().nullable(),
  personality: yup.string().nullable(),
  character: yup.string().nullable(),
});

export default function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 表单
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(memberSchema),
    defaultValues: {
      id: undefined,
      name: '',
      gender: 0,
      rel_type: "100",
      birthday: '',
      email: '',
      rel_desc: '',
      personality: '',
      character: '',
    }
  });

  // Fetch members from backend on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // 使用 POST 方法和新接口
      const res = await apiClient.post('/spwapi/auth/profile/member/list');
      if (res && res.code === 0) {
        setMembers(res.data || []);
      } else {
        toast.error(res?.msg || 'Failed to fetch members');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  // 打开新增
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
    setEditMember(null);
    setShowModal(true);
  };

  // 打开编辑
  const handleEdit = (member: any) => {
    // 保证 rel_type 是字符串
    reset({
      ...member,
      rel_type: String(member.rel_type ?? "100"),
      gender: member.gender ?? 0,
      birthday: member.birthday || '',
      email: member.email || '',
      rel_desc: member.rel_desc || '',
      personality: member.personality || '',
      character: member.character || '',
    });
    setEditMember(member);
    setShowModal(true);
  };

  // 打开删除确认框
  const handleDeleteClick = (member: Member) => {
    setDeleteTarget(member);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/profile/member/del', { member_id: deleteTarget.id });
      if (res && res.code === 0) {
        toast.success('Deleted successfully');
        setMembers(members => members.filter(m => m.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        toast.error(res?.msg || 'Delete failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  // 提交（新增/编辑共用）
  const onSubmit = async (data: any) => {
    try {
      const res = await apiClient.post('/spwapi/auth/profile/member/add', data);
      if (res && res.code === 0) {
        toast.success(data.id ? 'Member updated successfully' : 'Member added successfully');
        setShowModal(false);
        reset();
        fetchMembers();
      } else {
        toast.error(res?.msg || 'Operation failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editMember) return;
    const { name, value } = e.target;
    setEditMember({ ...editMember, [name]: name === 'gender' || name === 'flag' ? Number(value) : value });
  };

  // 添加成员方法
  const onAddMember = async (data: any) => {
    try {
      const res = await apiClient.post('/spwapi/auth/profile/member/add', data);
      if (res && res.code === 0) {
        toast.success('Member added successfully');
        setShowAddModal(false);
        reset();
        fetchMembers();
      } else {
        toast.error(res?.msg || 'Add failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Add failed');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Member Management</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          onClick={handleAdd}
        >
          Add Member
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <span className="text-lg text-gray-500">Loading...</span>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Relationship</th>
              <th className="py-2 px-4">Gender</th>
              <th className="py-2 px-4">Birthday</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} className="border-b">
                <td className="py-2 px-4">{member.name}</td>
                <td className="py-2 px-4">{member.email}</td>
                <td className="py-2 px-4">{member.rel_type}</td>
                <td className="py-2 px-4">{genderMap[member.gender] || 'Unknown'}</td>
                <td className="py-2 px-4">{member.birthday}</td>
                <td className="py-2 px-4">{statusMap[member.flag] || 'Unknown'}</td>
                <td className="py-2 px-4">
                  <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(member)}>Edit</button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => handleDeleteClick(member)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editMember ? 'Edit Member' : 'Add Member'}</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* 隐藏id字段 */}
              <input type="hidden" {...register('id')} />
              <div className="mb-3">
                <label className="block mb-1">Name<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Gender<span className="text-red-500">*</span></label>
                <select
                  {...register('gender')}
                  className="w-full border px-3 py-2 rounded"
                >
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Relationship<span className="text-red-500">*</span></label>
                <select
                  {...register('rel_type')}
                  className="w-full border px-3 py-2 rounded"
                >
                  {relTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.rel_type && <p className="text-red-500 text-xs">{errors.rel_type.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Birthday</label>
                <input
                  type="date"
                  {...register('birthday')}
                  className="w-full border px-3 py-2 rounded"
                  pattern="\d{4}-\d{2}-\d{2}"
                />
                {errors.birthday && <p className="text-red-500 text-xs">{errors.birthday.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full border px-3 py-2 rounded"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Relationship Description</label>
                <input
                  type="text"
                  {...register('rel_desc')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Personality</label>
                <input
                  type="text"
                  {...register('personality')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Character</label>
                <input
                  type="text"
                  {...register('character')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => { setShowModal(false); reset(); }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Member</h3>
            <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?</p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 