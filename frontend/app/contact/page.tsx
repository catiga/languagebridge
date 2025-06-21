'use client';
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FaEnvelope, FaQuestionCircle, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';

interface IFormInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactUsPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = data => {
    console.log(data);
    // Here you would typically send the data to your backend API
    toast.success("Your message has been sent successfully!");
  };
  
  const inputStyle = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="bg-gray-50 min-h-screen py-20 md:py-28">
      <ToastContainer position="bottom-right" />
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Get in Touch</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question or want to work with us? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 grid md:grid-cols-2 gap-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className={labelStyle}>Full Name</label>
                <input id="name" type="text" {...register("name", { required: true })} className={inputStyle} />
                {errors.name && <span className="text-red-500 text-sm mt-1">This field is required</span>}
              </div>
              <div>
                <label htmlFor="email" className={labelStyle}>Email Address</label>
                <input id="email" type="email" {...register("email", { required: true })} className={inputStyle} />
                {errors.email && <span className="text-red-500 text-sm mt-1">This field is required</span>}
              </div>
              <div>
                <label htmlFor="subject" className={labelStyle}>Subject</label>
                <select id="subject" {...register("subject", { required: true })} className={inputStyle}>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Student Support">Student Support</option>
                  <option value="Teacher Application">Teacher Application</option>
                  <option value="Partnerships">Partnerships</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className={labelStyle}>Message</label>
                <textarea id="message" rows={5} {...register("message", { required: true })} className={inputStyle}></textarea>
                {errors.message && <span className="text-red-500 text-sm mt-1">This field is required</span>}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
              >
                Send Message
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="bg-gray-100 rounded-lg p-8 flex flex-col justify-center"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
            <div className="space-y-6 text-gray-600">
              <div className="flex items-center space-x-4">
                <FaEnvelope className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Email Us</h3>
                  <a href="mailto:support@langbridge.io" className="hover:text-blue-600">support@langbridge.io</a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FaQuestionCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">FAQs</h3>
                  <p>Check our FAQ page for quick answers.</p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                 <h3 className="font-semibold text-gray-800 mb-4">Follow Us</h3>
                 <div className="flex space-x-4">
                    <a href="#" className="text-gray-500 hover:text-blue-600"><FaTwitter size={24}/></a>
                    <a href="#" className="text-gray-500 hover:text-blue-600"><FaLinkedin size={24}/></a>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 