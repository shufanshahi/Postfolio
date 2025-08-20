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
                    <h2 className="text-2xl font-bold text-slate-800">Education Management</h2>
                    <p className="text-slate-600">Manage your complete educational journey from school to university</p>
                </div>

                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddForm} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white">
                            <Plus className="w-4 h-4" />
                            Add Education
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-slate-800">
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
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-800">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="text-2xl mb-2">🏫</div>
                            <h3 className="font-semibold text-slate-800">Add School</h3>
                            <p className="text-sm text-slate-600 mb-3">Add your school education details</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-slate-300 text-slate-600 hover:bg-slate-100"
                            >
                                Add School
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="text-2xl mb-2">🎓</div>
                            <h3 className="font-semibold text-slate-800">Add University</h3>
                            <p className="text-sm text-slate-600 mb-3">Add your university semester details</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-slate-300 text-slate-600 hover:bg-slate-100"
                            >
                                Add University
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="text-2xl mb-2">📊</div>
                            <h3 className="font-semibold text-slate-800">View Summary</h3>
                            <p className="text-sm text-slate-600 mb-3">See your complete education overview</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="border-slate-300 text-slate-600 hover:bg-slate-100"
                            >
                                View Timeline
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Education Tips */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-slate-800">💡 Education Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-start gap-2">
                            <span className="text-sky-500">•</span>
                            <span>Add all your school classes (1-12) to show your complete academic journey</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-emerald-500">•</span>
                            <span>SSC (Class 10) and HSC (Class 12) results are automatically detected</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-500">•</span>
                            <span>Track your university progress semester by semester (1-8)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span>Include certificate and transcript URLs for verification</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>Mark semesters as completed when you finish them</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EducationManagement;