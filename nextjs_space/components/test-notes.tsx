'use client';

import { useState, useEffect } from 'react';
import { TestNote } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Loader2, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

interface TestNotesProps {
  testId: string;
  patientId: string;
}

export function TestNotes({ testId, patientId }: TestNotesProps) {
  const { toast } = useToast();
  const { data: session } = useSession() || {};
  const [notes, setNotes] = useState<TestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'High'>('Low');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch notes
  useEffect(() => {
    fetchNotes();
  }, [testId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test-notes?test_id=${testId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Note content is required',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/test-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: testId,
          patient_id: patientId,
          note: newNote,
          priority: newPriority,
          created_by: session?.user?.email || session?.user?.name || 'Unknown',
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      const addedNote = await response.json();
      setNotes([addedNote, ...notes]);
      setNewNote('');
      setNewPriority('Low');
      setShowAddForm(false);

      toast({
        title: 'Note added',
        description: 'Your note has been saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setDeletingId(noteId);
    try {
      const response = await fetch(`/api/test-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      setNotes(notes.filter(n => n.id !== noteId));
      toast({
        title: 'Note deleted',
        description: 'The note has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete note',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Notes & Comments</h3>
          <p className="text-sm text-gray-600">Track billing issues, insurance requests, and other important notes</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="pt-6">
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={newPriority}
                  onValueChange={(value) => setNewPriority(value as 'Low' | 'High')}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low Priority</SelectItem>
                    <SelectItem value="High">!! HIGH PRIORITY !!</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note *</Label>
                <Textarea
                  id="note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter note details (e.g., billing issue, insurance request, code correction needed, etc.)..."
                  disabled={submitting}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Note'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNote('');
                    setNewPriority('Low');
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notes yet</p>
                <p className="text-sm mt-1">Add notes to track billing issues, insurance requests, or other important information</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className={`${
                note.priority === 'High'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Priority Badge */}
                    <div>
                      {note.priority === 'High' ? (
                        <Badge className="bg-red-600 text-white font-bold px-3 py-1">
                          !! HIGH PRIORITY !!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Low Priority
                        </Badge>
                      )}
                    </div>

                    {/* Note Content */}
                    <p className="text-gray-900 whitespace-pre-wrap">{note.note}</p>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {note.created_by}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingId === note.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
