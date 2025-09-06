'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    X, 
    Plus, 
    Calendar, 
    DollarSign,
    Clock,
    Repeat,
    Loader2,
    AlertCircle
} from 'lucide-react';

export default function EditMentorshipModal({ isOpen, onClose, mentorship, onSave }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        status: 'ACTIVE',
        price: '',
        availableTimes: [],
        repeatStatus: false
    });
    const [newTimeSlot, setNewTimeSlot] = useState('');

    // Initialize form data when mentorship changes
    useEffect(() => {
        if (mentorship) {
            setFormData({
                name: mentorship.name || '',
                specialization: mentorship.specialization || '',
                status: mentorship.status || 'ACTIVE',
                price: mentorship.price?.toString() || '',
                availableTimes: mentorship.availableTimes || [],
                repeatStatus: mentorship.repeatStatus || false
            });
        }
    }, [mentorship]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addTimeSlot = () => {
        if (newTimeSlot) {
            // Convert datetime-local format to the required format (YYYY-MM-DD HH:MM:00)
            const date = new Date(newTimeSlot);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            
            const formattedTime = `${year}-${month}-${day} ${hour}:${minute}:00`;
            
            setFormData(prev => ({
                ...prev,
                availableTimes: [...prev.availableTimes, formattedTime]
            }));
            setNewTimeSlot('');
        }
    };

    const removeTimeSlot = (index) => {
        setFormData(prev => ({
            ...prev,
            availableTimes: prev.availableTimes.filter((_, i) => i !== index)
        }));
    };

    const formatDateTimeForInput = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatDateTimeForDisplay = (dateTimeString) => {
        if (!dateTimeString) return '';
        
        // Handle both formats: "2025-09-12 16:00:00" and ISO format
        let date;
        if (dateTimeString.includes('T')) {
            date = new Date(dateTimeString);
        } else {
            // Format: "2025-09-12 16:00:00"
            date = new Date(dateTimeString.replace(' ', 'T'));
        }
        
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Mentorship name is required');
            return false;
        }
        if (!formData.specialization.trim()) {
            setError('Specialization is required');
            return false;
        }
        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
            setError('Please enter a valid price');
            return false;
        }
        if (formData.availableTimes.length === 0) {
            setError('At least one available time slot is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            
            const updateData = {
                name: formData.name.trim(),
                specialization: formData.specialization.trim(),
                status: formData.status,
                price: parseFloat(formData.price),
                availableTimes: formData.availableTimes,
                repeatStatus: formData.repeatStatus
            };

            const response = await fetch(`http://localhost:8080/api/mentorships/${mentorship.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error('Failed to update mentorship');
            }

            const updatedMentorship = await response.json();
            onSave(updatedMentorship);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update mentorship');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="h-5 w-5 text-teal-600" />
                        Edit Mentorship
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-600">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Mentorship Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter mentorship name"
                                    className="rounded-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization *</Label>
                                <Input
                                    id="specialization"
                                    value={formData.specialization}
                                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                                    placeholder="e.g., Frontend Development"
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(value) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price per Session *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange('price', e.target.value)}
                                        placeholder="0.00"
                                        className="pl-10 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="repeatStatus"
                                    checked={formData.repeatStatus}
                                    onChange={(e) => handleInputChange('repeatStatus', e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="repeatStatus" className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-slate-500" />
                                    Recurring Mentorship
                                </Label>
                            </div>
                            <p className="text-sm text-slate-500">
                                When enabled, the time slots will repeat weekly
                            </p>
                        </div>
                    </div>

                    {/* Available Times */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Available Times</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Select date and time for your mentorship sessions.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="datetime-local"
                                        value={newTimeSlot}
                                        onChange={(e) => setNewTimeSlot(e.target.value)}
                                        className="rounded-lg"
                                        placeholder="Select date and time"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={addTimeSlot}
                                    className="px-4 rounded-lg bg-teal-600 hover:bg-teal-700"
                                    disabled={!newTimeSlot}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {formData.availableTimes.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Available Time Slots ({formData.availableTimes.length})</Label>
                                    <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                                        <div className="flex flex-wrap gap-2">
                                            {formData.availableTimes.map((time, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="flex items-center gap-2 px-3 py-1"
                                                >
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTimeForDisplay(time)}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTimeSlot(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Mentorship'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
