import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import EducationTimeline from './EducationTimeline';
import EducationForm from './EducationForm';

const EducationManagement = ({ userId }) => {
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token'); // or sessionStorage if you prefer
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleSuccess = () => {
        setShowForm(false);
        setEditData(null);
        setRefreshKey(prev => prev + 1);
    };

    const handleEdit = (institution) => {
        setEditData(institution);
        setShowForm(true);
    };

    const handleDelete = async (institution) => {
        setDeleteLoading(true);
        try {
            const url = institution.type === 'school'
                ? `http://localhost:8080/api/education/schools/${institution.data.id}`
                : `http://localhost:8080/api/education/universities/${institution.data.id}`;

            await fetch(url, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting education:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const openAddForm = () => {
        setEditData(null);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Education Management</h2>
                    <p className="text-gray-300">Manage your complete educational journey from school to university</p>
                </div>

                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddForm} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Education
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editData ? 'Edit Education Entry' : 'Add New Education Entry'}
                            </DialogTitle>
                        </DialogHeader>
                        <EducationForm
                            onSuccess={handleSuccess}
                            editData={editData}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Education Timeline */}
            <EducationTimeline
                key={refreshKey}
                userId={userId}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Quick Actions Card */}
            <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">🏫</div>
                            <h3 className="font-semibold text-white">Add School</h3>
                            <p className="text-sm text-gray-300 mb-3">Add your school education details</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                Add School
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">🎓</div>
                            <h3 className="font-semibold text-white">Add University</h3>
                            <p className="text-sm text-gray-300 mb-3">Add your university semester details</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                Add University
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">📊</div>
                            <h3 className="font-semibold text-white">View Summary</h3>
                            <p className="text-sm text-gray-300 mb-3">See your complete education overview</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                View Timeline
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Education Tips */}
            <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                    <CardTitle className="text-white">💡 Education Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Add all your school classes (1-12) to show your complete academic journey</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            <span>SSC (Class 10) and HSC (Class 12) results are automatically detected</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>Track your university progress semester by semester (1-8)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-orange-400">•</span>
                            <span>Include certificate and transcript URLs for verification</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>Mark semesters as completed when you finish them</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EducationManagement;