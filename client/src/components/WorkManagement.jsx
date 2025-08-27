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

            {/* Quick Actions Card */}
            <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">💼</div>
                            <h3 className="font-semibold text-white">Add Job</h3>
                            <p className="text-sm text-gray-300 mb-3">Add your work experience details</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                Add Job
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">📈</div>
                            <h3 className="font-semibold text-white">Career Growth</h3>
                            <p className="text-sm text-gray-300 mb-3">Track your professional progression</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                View Timeline
                            </Button>
                        </div>

                        <div className="text-center p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                            <div className="text-2xl mb-2">🎯</div>
                            <h3 className="font-semibold text-white">Skills & Tech</h3>
                            <p className="text-sm text-gray-300 mb-3">Showcase your technical expertise</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditData(null);
                                    setShowForm(true);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                                Add Skills
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Work Tips */}
            <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                    <CardTitle className="text-white">💡 Work Experience Tips</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-gray-300">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>Include specific achievements and metrics to showcase your impact</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            <span>List technologies and tools you used in each role</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>Use action verbs to describe your responsibilities</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-orange-400">•</span>
                            <span>Keep descriptions concise but impactful</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>Mark current positions to show ongoing experience</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WorkManagement; 