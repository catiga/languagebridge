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
  const [editMember, setEditMember] = useState<Partial<Member> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // 添加成员表单
  const {
    register: addRegister,
    handleSubmit: handleAddSubmit,
    reset: resetAddForm,
    formState: { errors: addErrors, isSubmitting: addSubmitting }
  } = useForm({
    resolver: yupResolver(memberSchema),
    defaultValues: {
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

  const handleAdd = () => {
    setEditMember({ ...defaultMember });
    setShowModal(true);
  };

  const handleEdit = (member: Member) => {
    setEditMember({ ...member });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      // 假设接口 /spwapi/member/delete
      const res = await apiClient.post('/spwapi/member/delete', { id });
      if (res && res.code === 0) {
        toast.success('Deleted successfully');
        fetchMembers();
      } else {
        toast.error(res?.msg || 'Delete failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditMember(null);
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    try {
      // 新增或编辑接口
      const api = editMember.id ? '/spwapi/member/update' : '/spwapi/member/add';
      const res = await apiClient.post(api, editMember);
      if (res && res.code === 0) {
        toast.success(editMember.id ? 'Updated successfully' : 'Added successfully');
        handleModalClose();
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
        resetAddForm();
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
          onClick={() => setShowAddModal(true)}
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
                  <button className="text-red-500 hover:underline" onClick={() => handleDelete(member.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Member</h3>
            <form onSubmit={handleAddSubmit(onAddMember)}>
              <div className="mb-3">
                <label className="block mb-1">Name<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...addRegister('name')}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
                {addErrors.name && <p className="text-red-500 text-xs">{addErrors.name.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Gender<span className="text-red-500">*</span></label>
                <select
                  {...addRegister('gender')}
                  className="w-full border px-3 py-2 rounded"
                >
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {addErrors.gender && <p className="text-red-500 text-xs">{addErrors.gender.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Relationship<span className="text-red-500">*</span></label>
                <select
                  {...addRegister('rel_type')}
                  className="w-full border px-3 py-2 rounded"
                >
                  {relTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {addErrors.rel_type && <p className="text-red-500 text-xs">{addErrors.rel_type.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Birthday</label>
                <input
                  type="date"
                  {...addRegister('birthday')}
                  className="w-full border px-3 py-2 rounded"
                  pattern="\d{4}-\d{2}-\d{2}"
                />
                {addErrors.birthday && <p className="text-red-500 text-xs">{addErrors.birthday.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  {...addRegister('email')}
                  className="w-full border px-3 py-2 rounded"
                />
                {addErrors.email && <p className="text-red-500 text-xs">{addErrors.email.message as string}</p>}
              </div>
              <div className="mb-3">
                <label className="block mb-1">Relationship Description</label>
                <input
                  type="text"
                  {...addRegister('rel_desc')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Personality</label>
                <input
                  type="text"
                  {...addRegister('personality')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Character</label>
                <input
                  type="text"
                  {...addRegister('character')}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  disabled={addSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                  disabled={addSubmitting}
                >
                  {addSubmitting ? (
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
    </div>
  );
} 