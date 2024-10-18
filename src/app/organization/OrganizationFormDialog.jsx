import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const validationSchema = Yup.object().shape({
  title: Yup.string().required('Organization Name is required'),
  address: Yup.string().required('Address is required'),
  contactNumber: Yup.string().matches(/^\d{10}$/, 'Contact Number must be 10 digits').required('Contact Number is required'),
  regNumber: Yup.string().required('Registration Number is required'),
});

function FormDialog({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;

  const initialValues = {
    title: '',
    address: '',
    contactNumber: '',
    regNumber: '',
  };

  const handleSubmit = (values, { setSubmitting }) => {
    onSubmit(values);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className='w-full flex justify-between items-center mb-6'>
          <h2 className="text-xl font-bold text-gray-800">Add New Organization</h2>
          <FontAwesomeIcon onClick={onClose} className='cursor-pointer text-gray-800' icon={faXmark} />
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className='h-[80px]'>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              <div className='h-[80px]'>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Field
                  type="text"
                  id="address"
                  name="address"
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="address" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              <div className='h-[80px]'>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <Field
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="contactNumber" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              <div className='h-[80px]'>
                <label htmlFor="regNumber" className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <Field
                  type="text"
                  id="regNumber"
                  name="regNumber"
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="regNumber" component="div" className="text-red-500 text-xs mt-1" />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 text-xs w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'SUBMITTING...' : 'ADD ORGANIZATION'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default FormDialog;