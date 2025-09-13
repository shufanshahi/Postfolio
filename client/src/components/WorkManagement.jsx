import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import WorkTimeline from './WorkTimeline';
import WorkForm from './WorkForm';

const WorkManagement = ({ userId }) => {
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
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

    const handleEdit = (work) => {
        setEditData(work);
        setShowForm(true);
    };

    const handleDelete = async (work) => {
        setDeleteLoading(true);
        try {
            const url = `http://localhost:8080/api/work/${work.data.id}`;

            await fetch(url, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting work experience:', error);
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
                    <h2 className="text-2xl font-bold text-white">Work Experience Management</h2>
                    <p className="text-gray-300">Manage your professional work experience and career journey</p>
                </div>

                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddForm} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Work Experience
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editData ? 'Edit Work Experience' : 'Add New Work Experience'}
                            </DialogTitle>
                        </DialogHeader>
                        <WorkForm
                            onSuccess={handleSuccess}
                            editData={editData}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Work Timeline */}
            <WorkTimeline
                key={refreshKey}
                userId={userId}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default WorkManagement; 