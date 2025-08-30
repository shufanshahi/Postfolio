import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Loader2 } from 'lucide-react';

const WorkForm = ({ onSuccess, editData }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editData) {
            setFormData({
                companyName: editData.companyName || '',
                position: editData.position || '',
                startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
                endDate: editData.endDate ? editData.endDate.split('T')[0] : '',
                isCurrent: editData.isCurrent || false
            });
        }
    }, [editData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const url = editData ? `http://localhost:8080/api/work/${editData.id}` : 'http://localhost:8080/api/work';
            const method = editData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save work experience');
            onSuccess();
        } catch (error) {
            console.error('Error saving work experience:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-700">Company Name *</Label>
                    <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Company name"
                        className="bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-sky-500"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="position" className="text-slate-700">Position *</Label>
                    <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="Job position"
                        className="bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-sky-500"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-slate-700">Start Date *</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-sky-500"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-slate-700">End Date {!formData.isCurrent && '*'}</Label>
                    <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        disabled={formData.isCurrent}
                        className="bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-sky-500 disabled:opacity-50"
                        required={!formData.isCurrent}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        isCurrent: checked,
                        endDate: checked ? '' : prev.endDate
                    }))}
                    className="border-slate-300 data-[state=checked]:bg-sky-600"
                />
                <Label htmlFor="isCurrent" className="text-slate-700">
                    Currently working here
                </Label>
            </div>

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSuccess()}
                    className="border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            {editData ? 'Update' : 'Add'} Work Experience
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default WorkForm; 