'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from 'react-modal';

// Initialize modal only on client side
if (typeof window !== 'undefined') {
    Modal.setAppElement('body');
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        birthDate: '',
        phoneNumber: '',
        address: '',
        sscResult: '',
        hscResult: '',
        universityResult: '',
        positionOrInstitue: '',
        profilePicture: null
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log(token);
            const response = await fetch('http://localhost:8080/api/profile/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setProfile(data);

            setFormData({
                bio: data.bio || '',
                birthDate: data.birthDate ? data.birthDate.substring(0, 10) : '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                sscResult: data.sscResult || '',
                hscResult: data.hscResult || '',
                universityResult: data.universityResult || '',
                positionOrInstitue: data.positionOrInstitue || '',
                profilePicture: null
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, profilePicture: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formDataToSend.append(key, value);
                }
            });

            const response = await fetch('http://localhost:8080/api/profile', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (!response.ok) throw new Error('Failed to update profile');

            setIsModalOpen(false);
            fetchProfile();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!profile) return <div>No profile found</div>;

    return (
        <div className="profile-container">
            <h1 className="profile-title">Profile</h1>

            <button
                onClick={() => setIsModalOpen(true)}
                className="update-button"
            >
                Update Profile
            </button>

            <div className="profile-section">
                <div className="profile-picture">
                    {profile.pictureBase64 ? (
                        <img
                            src={`data:image/jpeg;base64,${profile.pictureBase64}`}
                            alt="Profile"
                            className="profile-image"
                        />
                    ) : (
                        <div className="profile-image-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-5.523 0-10 3.582-10 8h20c0-4.418-4.477-8-10-8z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="profile-details">
                    <section className="info-section">
                        <h2>Personal Information</h2>
                        <p><strong>Bio:</strong> {profile.bio || 'Not provided'}</p>
                        <p><strong>Birth Date:</strong> {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : 'Not provided'}</p>
                        <p><strong>Phone:</strong> {profile.phoneNumber || 'Not provided'}</p>
                        <p><strong>Address:</strong> {profile.address || 'Not provided'}</p>
                    </section>

                    <section className="info-section">
                        <h2>Education</h2>
                        <p><strong>SSC Result:</strong> {profile.sscResult || 'Not provided'}</p>
                        <p><strong>HSC Result:</strong> {profile.hscResult || 'Not provided'}</p>
                        <p><strong>University Result:</strong> {profile.universityResult || 'Not provided'}</p>
                        <p><strong>Position/Institute:</strong> {profile.positionOrInstitue || 'Not provided'}</p>
                    </section>
                </div>
            </div>

            <button
                onClick={() => router.push('/dashboard')}
                className="back-button"
            >
                Back to Dashboard
            </button>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Update Profile"
                className="modal"
                overlayClassName="modal-overlay"
            >
                <h2>Update Profile</h2>
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Birth Date</label>
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>SSC Result</label>
                        <input
                            type="text"
                            name="sscResult"
                            value={formData.sscResult}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>HSC Result</label>
                        <input
                            type="text"
                            name="hscResult"
                            value={formData.hscResult}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>University Result</label>
                        <input
                            type="text"
                            name="universityResult"
                            value={formData.universityResult}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Position/Institute</label>
                        <input
                            type="text"
                            name="positionOrInstitue"
                            value={formData.positionOrInstitue}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit">Save Changes</button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
        .profile-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2rem;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .profile-title {
          color: #2d3748;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .update-button {
          position: absolute;
          top: 2rem;
          right: 2rem;
          padding: 0.5rem 1rem;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .update-button:hover {
          background-color: #3182ce;
        }
        
        .profile-section {
          display: flex;
          gap: 2rem;
          margin-top: 1rem;
        }
        
        .profile-picture {
          flex: 1;
          max-width: 300px;
          min-width: 250px;
        }
        
        .profile-image {
          width: 100%;
          height: auto;
          border-radius: 12px;
          object-fit: cover;
          aspect-ratio: 1/1;
        }
        
        .profile-image-placeholder {
          width: 100%;
          aspect-ratio: 1/1;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #cbd5e0;
          border: 2px dashed #e2e8f0;
        }
        
        .profile-image-placeholder svg {
          width: 50%;
          height: 50%;
        }
        
        .profile-details {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .info-section {
          background-color: #f8fafc;
          padding: 1.25rem;
          border-radius: 8px;
        }
        
        h2 {
          color: #4a5568;
          margin-bottom: 1rem;
          font-size: 1.25rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        
        p {
          margin: 0.5rem 0;
          color: #4a5568;
          line-height: 1.5;
        }
        
        .back-button {
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          display: block;
          margin-left: auto;
        }
        
        .back-button:hover {
          background-color: #3182ce;
        }

        .loading, .error {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
        }

        .error {
          color: #e53e3e;
        }

        .modal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #4a5568;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        .form-actions button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .form-actions button[type="button"] {
          background-color: #e2e8f0;
          border: none;
        }

        .form-actions button[type="submit"] {
          background-color: #4299e1;
          color: white;
          border: none;
        }

        @media (max-width: 768px) {
          .profile-section {
            flex-direction: column;
          }
          
          .profile-picture {
            max-width: 100%;
            margin: 0 auto;
          }

          .update-button {
            position: static;
            margin-bottom: 1rem;
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}