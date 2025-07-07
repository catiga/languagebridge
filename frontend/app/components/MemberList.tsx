'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { InferType } from 'yup';

interface Member {
  id: number;
  name: string;
  email: string;
  rel_type: string;
  gender: number;
  birthday: string;
  flag: number;
  login_id?: string;
  password?: string;
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
const memberSchema = yup.object({
  id: yup.number().required(),
  name: yup.string().required('Name is required'),
  gender: yup.number().oneOf([0, 1, 2]).required('Gender is required'),
  rel_type: yup.string().oneOf(["100", "101", "200", "900"]).required('Relationship is required'),
  birthday: yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in yyyy-MM-dd format').required('Birthday is required'),
  email: yup.string().email('Invalid email'),
  rel_desc: yup.string(),
  personality: yup.string().required('Personality is required'),
  character: yup.string().required('Character is required'),
  login_id: yup.string(),
  password: yup.string(),
});

// Define the form type
type MemberFormType = Omit<InferType<typeof memberSchema>, 'login_id' | 'password'> & {
  login_id?: string;
  password?: string;
};

// API response type
interface ApiResponse<T> {
  code: number;
  data: T;
  msg?: string;
}

interface MemberListProps {
  onLoading: (loading: boolean) => void;
}

export default function StudentList({ onLoading }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const defaultMemberForm: MemberFormType = {
    id: 0,
    name: '',
    gender: 0,
    rel_type: '100',
    birthday: '',
    email: '',
    rel_desc: '',
    personality: '',
    character: '',
    login_id: '',
    password: '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<MemberFormType>({
    resolver: yupResolver(memberSchema) as any,
    defaultValues: {
      ...defaultMemberForm,
      rel_type: '100' as MemberFormType['rel_type'],
    } as MemberFormType
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    onLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<Member[]>>('/spwapi/auth/profile/member/list');
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
      ...defaultMemberForm,
      rel_type: '100' as MemberFormType['rel_type'],
    });
    setShowModal(true);
    setShowModalEdit(false);
  };

  const handleEdit = (member: any) => {
    reset({
      id: member.id,
      name: member.name || '',
      gender: typeof member.gender === 'number' ? member.gender : 0,
      rel_type: (member.rel_type || '100') as MemberFormType['rel_type'],
      birthday: member.birthday?.split('T')[0] || '',
      email: member.email || '',
      rel_desc: member.rel_desc || '',
      personality: member.personality || '',
      character: member.character || '',
      login_id: member.login_id || '',
      password: '', // 编辑时密码不回显
    });
    setShowModal(true);
    setShowModalEdit(true);
  };

  const handleDeleteClick = (member: Member) => {
    setDeleteTarget(member);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/spwapi/auth/profile/member/del', { member_id: deleteTarget.id });
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

  const onSubmit = async (data: MemberFormType) => {
    console.log('点击了提交', data);
    const payload = {
      id: data.id,
      name: data.name,
      email: data.email,
      rel_type: data.rel_type,
      rel_desc: data.rel_desc,
      gender: Number(data.gender),
      birthday: data.birthday,
      personality: data.personality,
      character: data.character,
      login_id: data.login_id,
      password: data.password,
    };
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/auth/profile/member/add', payload);
      if (res && res.code === 0) {
        toast.success(data.id ? 'Student updated successfully' : 'Student added successfully');
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
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-5xl mx-auto mt-6">
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800 mr-4">Student Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Add Student
        </button>
      </div>
      <table className="w-full border-t border-gray-100 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-3 font-semibold text-gray-600">Name</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Email</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Relationship</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Gender</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Birthday</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Status</th>
            <th className="py-2 px-3 font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-400">No members found.</td>
            </tr>
          ) : (
            members.map(member => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition">
                <td className="py-2 px-3 whitespace-nowrap">{member.name}</td>
                <td className="py-2 px-3 whitespace-nowrap">{member.email}</td>
                <td className="py-2 px-3 whitespace-nowrap">{relTypeOptions.find(o => o.value === String(member.rel_type))?.label || member.rel_type}</td>
                <td className="py-2 px-3 whitespace-nowrap">{genderMap[member.gender] || 'Unknown'}</td>
                <td className="py-2 px-3 whitespace-nowrap">{member.birthday?.split('T')[0]}</td>
                <td className="py-2 px-3 whitespace-nowrap">{statusMap[member.flag] || 'Unknown'}</td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <button className="text-blue-600 hover:underline font-medium mr-2" onClick={() => handleEdit(member)}>Edit</button>
                  <button className="text-red-500 hover:underline font-medium" onClick={() => handleDeleteClick(member)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-blue-100">
            <h3 className="text-lg font-bold mb-4">{showModalEdit ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input type="hidden" {...register('id')} />
              <div>
                <label className={labelStyle}>Name<span className="text-red-500">*</span></label>
                <input type="text" {...register('name', { required: true })} className={inputStyle} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Gender<span className="text-red-500">*</span></label>
                  <select {...register('gender', { required: true })} className={inputStyle}>
                    {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message as string}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Relationship<span className="text-red-500">*</span></label>
                  <select {...register('rel_type', { required: true })} className={inputStyle}>
                    {relTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {errors.rel_type && <p className="text-red-500 text-xs mt-1">{errors.rel_type.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div>
                <label className={labelStyle}>Relationship Description</label>
                <input type="text" {...register('rel_desc')} className={inputStyle} placeholder="e.g. Son, Daughter, Nephew..." />
                {errors.rel_desc && <p className="text-red-500 text-xs mt-1">{errors.rel_desc.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Personality</label>
                  <input type="text" {...register('personality')} className={inputStyle} />
                  {errors.personality && <p className="text-red-500 text-xs mt-1">{errors.personality.message as string}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Character</label>
                  <input type="text" {...register('character')} className={inputStyle} />
                  {errors.character && <p className="text-red-500 text-xs mt-1">{errors.character.message as string}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Login ID</label>
                  <input type="text" {...register('login_id')} className={inputStyle} />
                  {errors.login_id && <p className="text-red-500 text-xs mt-1">{errors.login_id.message as string}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Password</label>
                  <input type="password" {...register('password')} className={inputStyle} autoComplete="new-password" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
                </div>
              </div>
              <div className="text-xs text-blue-600 mt-2 mb-1 font-semibold">If you set both Login ID and Password, the student can log in to the student portal. If left blank, login is not enabled for this student.</div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center" disabled={isSubmitting}>
                  {isSubmitting && <span className="loader mr-2"></span>}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-red-100">
            <h3 className="text-xl font-bold mb-2">Delete Student</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center" onClick={handleConfirmDelete} disabled={deleteLoading}>
                {deleteLoading && <span className="loader mr-2"></span>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 