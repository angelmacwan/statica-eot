import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getUserProjects, createProject, deleteProject } from '../firebase/firestoreService';
import { Project } from '../types/project';
import { Navbar } from '../components/layout/Navbar';
import { Plus, FolderKanban, ArrowRight, Trash2, Calendar, HardHat, Search } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Project modal state
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newCraneType, setNewCraneType] = useState<'EOT' | 'Gantry' | 'Other'>('EOT');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getUserProjects(user.uid);
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    setCreating(true);
    try {
      const proj = await createProject(user.uid, newProjectName.trim(), newCraneType, newDescription.trim());
      setShowModal(false);
      setNewProjectName('');
      setNewDescription('');
      navigate(`/projects/${proj.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this crane project?')) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-slate-700" />
              Crane Projects
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or create an EOT/Gantry crane engineering calculation workspace.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
          />
        </div>

        {/* Project List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
              {search ? 'No projects match your search criteria.' : 'Create your first crane engineering calculation project to begin.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="group p-5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl transition shadow-sm hover:shadow cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {proj.craneType} Crane
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition">
                    {proj.projectName}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>

                  <span className="flex items-center gap-1 text-slate-800 font-medium group-hover:translate-x-0.5 transition">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: New Project */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">New Crane Project</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10T EOT Crane - Billet Handling"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Crane Classification</label>
                  <select
                    value={newCraneType}
                    onChange={(e) => setNewCraneType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  >
                    <option value="EOT">Electric Overhead Travelling (EOT) Crane</option>
                    <option value="Gantry">Gantry / Goliath Crane</option>
                    <option value="Other">Custom Crane Mechanism</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Project scope, customer reference, or site requirements..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition shadow-sm"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
