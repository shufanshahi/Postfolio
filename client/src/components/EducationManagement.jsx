import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import SimpleEducationTimeline from './SimpleEducationTimeline';
import SimpleEducationForm from './SimpleEducationForm';

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
                        <SimpleEducationForm
                            onSuccess={handleSuccess}
                            editData={editData}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Education Timeline */}
            <SimpleEducationTimeline
                key={refreshKey}
                userId={userId}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />


        </div>
    );
};

export default EducationManagement;