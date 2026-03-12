/**
 * frontend/src/components/Admin/IssueCredential/CredentialForm.jsx
 * 
 * Form to collect credential information
 */

import React, { useState } from 'react';

const CredentialForm = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentId: '',
    degree: '',
    major: '',
    graduationDate: '',
    gpa: '',
    honors: '',
    institution: 'University Name' // Default
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }

    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.studentEmail)) {
      newErrors.studentEmail = 'Invalid email format';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.degree.trim()) {
      newErrors.degree = 'Degree is required';
    }

    if (!formData.major.trim()) {
      newErrors.major = 'Major is required';
    }

    if (!formData.graduationDate) {
      newErrors.graduationDate = 'Graduation date is required';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Add metadata
    const completeData = {
      ...formData,
      credentialId: Date.now().toString(), // Simple ID generation
      issuedDate: new Date().toISOString(),
      metadata: {
        degree: formData.degree,
        major: formData.major,
        graduationDate: formData.graduationDate,
        gpa: formData.gpa,
        honors: formData.honors,
        institution: formData.institution
      }
    };

    onComplete(completeData);
  };

  return (
    <div className="credential-form">
      <h2>Step 1: Enter Credential Details</h2>
      <p>Fill in the student's information and credential details</p>

      <form onSubmit={handleSubmit}>
        {/* Student Information */}
        <div className="form-section">
          <h3>Student Information</h3>
          
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.studentName ? 'error' : ''}
            />
            {errors.studentName && <span className="error-text">{errors.studentName}</span>}
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleChange}
              placeholder="john.doe@university.edu"
              className={errors.studentEmail ? 'error' : ''}
            />
            {errors.studentEmail && <span className="error-text">{errors.studentEmail}</span>}
          </div>

          <div className="form-group">
            <label>Student ID *</label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="STU123456"
              className={errors.studentId ? 'error' : ''}
            />
            {errors.studentId && <span className="error-text">{errors.studentId}</span>}
          </div>
        </div>

        {/* Academic Information */}
        <div className="form-section">
          <h3>Academic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Degree Type *</label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className={errors.degree ? 'error' : ''}
              >
                <option value="">Select degree</option>
                <option value="Bachelor of Science">Bachelor of Science</option>
                <option value="Bachelor of Arts">Bachelor of Arts</option>
                <option value="Master of Science">Master of Science</option>
                <option value="Master of Arts">Master of Arts</option>
                <option value="PhD">PhD</option>
              </select>
              {errors.degree && <span className="error-text">{errors.degree}</span>}
            </div>

            <div className="form-group">
              <label>Major/Field *</label>
              <input
                type="text"
                name="major"
                value={formData.major}
                onChange={handleChange}
                placeholder="Computer Science"
                className={errors.major ? 'error' : ''}
              />
              {errors.major && <span className="error-text">{errors.major}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Graduation Date *</label>
              <input
                type="date"
                name="graduationDate"
                value={formData.graduationDate}
                onChange={handleChange}
                className={errors.graduationDate ? 'error' : ''}
              />
              {errors.graduationDate && <span className="error-text">{errors.graduationDate}</span>}
            </div>

            <div className="form-group">
              <label>GPA (Optional)</label>
              <input
                type="text"
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                placeholder="3.75"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Honors/Awards (Optional)</label>
            <input
              type="text"
              name="honors"
              value={formData.honors}
              onChange={handleChange}
              placeholder="Cum Laude, Dean's List"
            />
          </div>

          <div className="form-group">
            <label>Institution</label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="University Name"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Next: Upload Certificate →
          </button>
        </div>
      </form>
    </div>
  );
};

export default CredentialForm;