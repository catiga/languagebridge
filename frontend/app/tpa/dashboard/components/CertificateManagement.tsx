'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaPlus, FaTimes, FaUpload, FaCertificate, FaBuilding, FaCalendarAlt, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';

interface Certificate {
  id: number;
  title: string;
  description: string;
  issuingOrganization?: string;
  issueDate?: string;
  imageUrl?: string;
}

// Backend data structure
interface CertificateFromAPI {
  id: number;
  teacher_id: number;
  title: string;
  achievement: string;
  get_date?: string;
  add_time: string;
  flag: number;
  issue_org?: string;
  document?: string;
}

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  
  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<CertificateFromAPI[]>>('/spwapi/tpa/auth/certificate/retrieve');
      if (response.data) {
        const mappedCerts = response.data.map((cert: CertificateFromAPI) => ({
          id: cert.id,
          title: cert.title,
          description: cert.achievement,
          issuingOrganization: cert.issue_org,
          issueDate: cert.get_date,
          imageUrl: cert.document,
        }));
        setCertificates(mappedCerts);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load certificates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const openModal = (cert?: Certificate) => {
    setEditingCertificate(cert || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCertificate(null);
  };

  const handleSave = async (cert: Omit<Certificate, 'id'> & { id?: number }) => {
    try {
      const payload = {
        id: cert.id || 0,
        title: cert.title,
        achievement: cert.description,
        issue_org: cert.issuingOrganization,
        get_date: cert.issueDate,
        document: cert.imageUrl,
      };

      await apiClient.post('/spwapi/tpa/auth/certificate/update', payload);

      toast.success(cert.id ? 'Certificate updated successfully!' : 'Certificate added successfully!');
      closeModal();
      fetchCertificates(); // Refresh the list
    } catch (error) {
      console.error('Failed to save certificate:', error);
      toast.error('Failed to save certificate.');
    }
  };

  const handleDeleteRequest = (id: number) => {
    setConfirmingDeleteId(id);
  };

  const executeDelete = async () => {
    if (confirmingDeleteId === null) return;
    
    setDeletingId(confirmingDeleteId);
    setConfirmingDeleteId(null); // Close confirmation modal

    try {
      await apiClient.get('/spwapi/tpa/auth/certificate/del', { id: confirmingDeleteId });
      toast.success('Certificate deleted successfully!');
      fetchCertificates(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete certificate:', error);
      toast.error('Failed to delete certificate.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Certificate Management
          </h2>
          <p className="text-gray-600 mt-2">Manage your professional qualifications and certificates</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-teal-500 text-white hover:shadow-lg"
        >
          <FaPlus />
          <span>Add New Certificate</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {certificates.map((cert) => (
            <motion.div
              key={cert.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all"
            >
              <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden bg-gray-200">
                {cert.imageUrl ? (
                  <Image src={cert.imageUrl} alt={cert.title} layout="fill" objectFit="cover" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <FaCertificate className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{cert.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{cert.description}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                {cert.issuingOrganization && (
                  <div className="flex items-center text-gray-500">
                    <FaBuilding className="w-4 h-4 mr-2" />
                    <span>{cert.issuingOrganization}</span>
                  </div>
                )}
                {cert.issueDate && (
                  <div className="flex items-center text-gray-500">
                    <FaCalendarAlt className="w-4 h-4 mr-2" />
                    <span>{cert.issueDate}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => openModal(cert)}
                  className="p-2 text-gray-500 hover:text-blue-600"
                >
                  <FaEdit />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDeleteRequest(cert.id)}
                  disabled={deletingId === cert.id}
                  className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === cert.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <FaTrash className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CertificateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        certificate={editingCertificate}
      />

      <ConfirmModal
        isOpen={confirmingDeleteId !== null}
        onClose={() => setConfirmingDeleteId(null)}
        onConfirm={executeDelete}
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate? This action cannot be undone."
      />
    </div>
  );
}

// Modal Component
interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (certificate: Omit<Certificate, 'id'> & { id?: number }) => void;
  certificate: Certificate | null;
}

function CertificateModal({ isOpen, onClose, onSave, certificate }: CertificateModalProps) {
  const [formData, setFormData] = useState<Omit<Certificate, 'id'>>({
    title: '',
    description: '',
    issuingOrganization: '',
    issueDate: '',
    imageUrl: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (certificate) {
      setFormData(certificate);
    } else {
      setFormData({
        title: '',
        description: '',
        issuingOrganization: '',
        issueDate: '',
        imageUrl: '',
      });
    }
  }, [certificate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      const uploadData = new FormData();
      uploadData.append('image', file);
      const apiKey = 'bbf086ea0c965eeb43bb982b048f1d1b';

      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: uploadData,
        });
        const result = await response.json();
        if (result.success) {
          setFormData({ ...formData, imageUrl: result.data.url });
          toast.success('Image uploaded!');
        } else {
          throw new Error('Image upload failed');
        }
      } catch (error) {
        toast.error('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and Description are required.');
      return;
    }
    onSave({ ...formData, id: certificate?.id });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {certificate ? 'Edit Certificate' : 'Add New Certificate'}
                </h3>
                <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Certificate Title (e.g., IELTS Academic)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Score or Description (e.g., Overall Band Score: 9.0)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Issuing Organization (e.g., British Council)"
                  value={formData.issuingOrganization}
                  onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
                />
                <input
                  type="date"
                  placeholder="Issue Date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  ) : formData.imageUrl ? (
                     <Image src={formData.imageUrl} alt="Certificate preview" width={100} height={70} className="rounded-md" />
                  ) : (
                    <>
                      <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">Click to upload certificate image</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium"
                >
                  Save
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-gray-600 mt-2 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                onClick={onConfirm}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium"
              >
                Confirm Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 