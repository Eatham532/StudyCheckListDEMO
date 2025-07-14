import { useEffect, useState } from 'react'
import mammothPlus from 'mammoth-plus';
import { parseSyllabusFromHtml } from '@/lib/utils';
import type { ProgressDocument, ProgressItem } from '@/lib/types';
import './App.css'

const STORAGE_KEY = 'progressData';

function App() {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [parsedData, setParsedData] = useState<ProgressDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [getFile, setFile] = useState<File | null>(null);
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [filterChecked, setFilterChecked] = useState<'unsure' | 'revise' | 'confident' | 'practised' | ''>('')
  const [loading, setLoading] = useState(false);

  // Load available docs from localStorage on mount
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY + ':'));
    setAvailableDocs(keys.map(k => k.replace(STORAGE_KEY + ':', '')));
    if (keys.length > 0 && !parsedData) {
      // Auto-load the first doc if nothing loaded
      const firstDoc = keys[0].replace(STORAGE_KEY + ':', '');
      handleSelectDoc(firstDoc);
    }
  }, []);

  // Save to localStorage whenever parsedData changes
  useEffect(() => {
    if (parsedData && fileName) {
      localStorage.setItem(`${STORAGE_KEY}:${fileName}` , JSON.stringify(parsedData));
      if (!availableDocs.includes(fileName)) {
        setAvailableDocs(prev => [...prev, fileName]);
      }
    }
  }, [parsedData, fileName]);

  // Set the first topic as default when data is loaded
  useEffect(() => {
    if (parsedData && parsedData.topics.length > 0 && !selectedTopic) {
      setSelectedTopic(parsedData.topics[0].id);
    }
  }, [parsedData, selectedDoc]);

  // Reset selected topic when switching documents
  useEffect(() => {
    if (parsedData && parsedData.topics.length > 0) {
      setSelectedTopic(parsedData.topics[0].id);
    }
  }, [selectedDoc]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setParsedData(null);
    setFileName(null);
    setLoading(true);
    const file = e.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }
    setFileName(file.name);
    setFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { value: text } = await mammothPlus.convertToHtml({ arrayBuffer });
      const data = parseSyllabusFromHtml(text);
      setParsedData(data);
      console.log(text)
      setSelectedDoc(file.name);
    } catch (err) {
      setError(`Failed to extract or parse document. Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (docName: string) => {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${docName}`);
    if (raw) {
      setParsedData(JSON.parse(raw));
      setFileName(docName);
      setSelectedDoc(docName);
    }
  };

  const handleReloadDoc = async () => {
    if (getFile) {
      setLoading(true);
      setError(null);
      setParsedData(null);
      setFileName(null);
      const file = getFile;
      if (!file) {
        setLoading(false);
        setError('No file selected for reloading.');
        return;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { value: text } = await mammothPlus.convertToHtml({ arrayBuffer });
        const data = parseSyllabusFromHtml(text);
        setParsedData(data);
        console.log(text)
        setSelectedDoc(file.name);
      } catch (err) {
        setError(`Failed to extract or parse document. Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Recursive update for nested ProgressItems
  function updateItemStatus(items: ProgressItem[], id: string, statusKey: keyof ProgressItem['status']): ProgressItem[] {
    return items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: {
            ...item.status,
            [statusKey]: !item.status[statusKey]
          }
        };
      }
      // Recursively update subpoints and sub-subpoints
      if (item.subpoints) {
        return {
          ...item,
          subpoints: updateItemStatus(item.subpoints, id, statusKey)
        };
      }
      return item;
    });
  }

  function handleStatusChange(sectionId: string, itemId: string, statusKey: keyof ProgressItem['status']) {
    if (!parsedData) return;
    const newData = {
      ...parsedData,
      topics: parsedData.topics.map(topic => ({
        ...topic,
        subTopics: topic.subTopics.map(sub => ({
          ...sub,
          contentSections: sub.contentSections.map(section => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              items: updateItemStatus(section.items, itemId, statusKey)
            };
          })
        }))
      }))
    };
    setParsedData(newData);
    if (fileName) {
      localStorage.setItem(`${STORAGE_KEY}:${fileName}`, JSON.stringify(newData));
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-indigo-100 p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 mt-8">
        <h1 className="text-3xl font-extrabold mb-6 text-indigo-700 tracking-tight text-center drop-shadow-lg">
          Progress Checker
        </h1>
        <div className="flex flex-col items-center mb-8">
          <div className={"flex items-center justify-center gap-4 w-full mb-4"}>
            <label>
              <input
                  type="file"
                  accept=".docx,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  tabIndex={-1}
              />
              <button
                  type="button"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                Upload Syllabus
              </button>
            </label>
            {selectedDoc && (
                <div className="mt-4">
                  <button
                      onClick={handleReloadDoc}
                      disabled={loading || !getFile}
                      className={`px-4 py-2 rounded font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {loading ? 'Loading...' : 'Reload Document'}
                  </button>
                </div>
            )}
          </div>
          {fileName && (
            <div className="mb-1 text-sm text-gray-700">
              <span className="font-semibold">Selected file:</span> {fileName}
            </div>
          )}
          {availableDocs.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <label className="mr-2 text-gray-700 font-semibold">View saved syllabus:</label>
              <select
                value={selectedDoc || ''}
                onChange={e => {
                  handleSelectDoc(e.target.value);
                  // Topic will be set by useEffect above
                }}
                className="border-2 border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="" disabled>Select a syllabus</option>
                {availableDocs.map(doc => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
              {selectedDoc && (
                <button
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 active:bg-red-700 text-xs font-semibold shadow transition"
                  onClick={() => {
                    localStorage.removeItem(`${STORAGE_KEY}:${selectedDoc}`);
                    const newDocs = availableDocs.filter(d => d !== selectedDoc);
                    setAvailableDocs(newDocs);
                    if (newDocs.length > 0) {
                      // Auto-switch to the next available doc
                      const nextDoc = newDocs[0];
                      handleSelectDoc(nextDoc);
                    } else {
                      // No docs left, revert to empty state
                      setParsedData(null);
                      setFileName(null);
                      setSelectedDoc(null);
                    }
                  }}
                  title={`Delete ${selectedDoc}`}
                >
                  Delete
                </button>
              )}
              <label className="ml-4 text-gray-700 font-semibold">Show only:</label>
              <select
                value={filterChecked || ''}
                onChange={e => setFilterChecked(e.target.value as any)}
                className="border-2 border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              >
                <option value="">All</option>
                <option value="unsure">Unsure</option>
                <option value="revise">Revise</option>
                <option value="confident">Confident</option>
                <option value="practised">Practised</option>
              </select>
            </div>
          )}

          {/* Show topic dropdown only when "Show only" is set to "All" */}
          {filterChecked === '' && parsedData && parsedData.topics.length > 0 && (
            <div className="w-full mt-8 flex justify-center">
              <div className="bg-indigo-50 rounded-lg shadow px-6 py-4 w-full max-w-xl flex flex-col items-center">
                <div className="flex items-center justify-center gap-3 w-full">
                  <label className="text-gray-700 font-semibold whitespace-nowrap">Topic:</label>
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="flex-grow px-4 py-2 rounded-lg border-2 border-indigo-300 focus:border-indigo-500 focus:outline-none bg-white transition-all duration-150 shadow-sm"
                  >
                    {parsedData.topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title} ({topic.id})
                      </option>
                    ))}
                  </select>
                  {/* Show if page is scrolled down */}
                  <span className="ml-4 text-xs text-gray-500" id="scroll-indicator"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 mt-2 text-center font-semibold">
              {error}
            </div>
          )}
        </div>
        <div className="w-full overflow-x-auto">
          {parsedData && parsedData.topics.length > 0 ? (
            parsedData.topics
              .filter(topic => filterChecked === '' ? topic.id === selectedTopic : true)
              .map((topic) => (
                <div key={topic.id} className="mb-12">
                  {topic.subTopics
                    .filter(sub => sub.contentSections && sub.contentSections.some((section) =>
                      section.items && section.items
                        .filter(item => filterChecked === '' || item.status[filterChecked])
                        .length > 0
                    ))
                    .map((sub) => (
                      <div key={sub.code} className="mb-8">
                        <h3 className="text-lg font-semibold mb-2 text-indigo-600 flex items-center gap-2">
                          {sub.title}
                          <span className="text-gray-400 text-sm font-normal">
                            ({sub.code})
                          </span>
                        </h3>
                        {sub.contentSections
                          .filter(section => section.items && section.items
                            .filter(item => filterChecked === '' || item.status[filterChecked])
                            .length > 0
                          )
                          .map((section) => (
                            <div key={section.id} className="mb-6">
                              <h4 className="text-base font-medium mb-2 text-indigo-500">
                                {section.title}
                              </h4>
                              <div className="rounded-lg overflow-hidden shadow bg-white">
                                <table className="min-w-full text-sm border border-gray-200">
                                  <thead className="bg-indigo-100">
                                    <tr>
                                      <th className="p-3 border-b text-left w-1/6 font-semibold text-indigo-700 border-gray-200">
                                        Dotpoint ID
                                      </th>
                                      <th className="p-3 border-b text-left font-semibold text-indigo-700 border-gray-200">
                                        Dotpoint
                                      </th>
                                      <th className="p-3 border-b text-center font-semibold text-indigo-700 w-24 border-gray-200">
                                        Unsure
                                      </th>
                                      <th className="p-3 border-b text-center font-semibold text-indigo-700 w-24 border-gray-200">
                                        Revise
                                      </th>
                                      <th className="p-3 border-b text-center font-semibold text-indigo-700 w-28 border-gray-200">
                                        Confident
                                      </th>
                                      <th className="p-3 border-b text-center font-semibold text-indigo-700 w-28 border-gray-200">
                                        Practised
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.items
                                      .filter(item =>
                                        (filterChecked === '' || item.status[filterChecked])
                                      )
                                      .map((item) => (
                                        <ItemRow key={item.id} item={item} sectionId={section.id} onStatusChange={handleStatusChange} />
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  {/* Show topic dropdown only when "Show only" is set to "All" */}
                  {filterChecked === '' && parsedData && parsedData.topics.length > 0 && (
                    <div className="w-full mt-8 flex justify-center">
                      <div className="bg-indigo-50 rounded-lg shadow px-6 py-4 w-full max-w-xl flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3 w-full">
                          <label className="text-gray-700 font-semibold whitespace-nowrap">Topic:</label>
                          <select
                            value={selectedTopic}
                            onChange={e => setSelectedTopic(e.target.value)}
                            className="flex-grow px-4 py-2 rounded-lg border-2 border-indigo-300 focus:border-indigo-500 focus:outline-none bg-white transition-all duration-150 shadow-sm"
                          >
                            {parsedData.topics.map((topic) => (
                              <option key={topic.id} value={topic.id}>
                                {topic.title} ({topic.id})
                              </option>
                            ))}
                          </select>
                          {/* Show if page is scrolled down */}
                          <span className="ml-4 text-xs text-gray-500" id="scroll-indicator"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="text-gray-500 py-12 text-center text-lg">
              Upload a <span className="font-semibold">.docx</span> or <span className="font-semibold">.txt</span> file to see parsed content.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, sectionId, onStatusChange }: { item: ProgressItem, sectionId: string, onStatusChange: (sectionId: string, itemId: string, statusKey: keyof ProgressItem['status']) => void }) {
  return (
    <tr className="align-top border-b hover:bg-indigo-50 transition-colors duration-150">
      <td className="p-3 font-mono text-xs text-gray-500 align-top">
        {item.id}
      </td>
      <td className="p-3 align-top text-left">
        <div className="mb-1" dangerouslySetInnerHTML={{ __html: item.text }} />
        {item.subpoints && item.subpoints.length > 0 && (
          <ul className="list-disc pl-6 mt-1 text-gray-700">
            {item.subpoints.map((sub, idx) => (
              <li key={sub.id || idx} className="mb-1">
                <span dangerouslySetInnerHTML={{ __html: sub.text }} />
                {sub.subpoints && sub.subpoints.length > 0 && (
                  <ul className="list-disc pl-6 mt-1">
                    {sub.subpoints.map((subsub, subIdx) => (
                      <li key={subsub.id || subIdx}>
                        <span dangerouslySetInnerHTML={{ __html: subsub.text }} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="p-3 align-top text-center">
        <input type="checkbox" checked={!!item.status.unsure} onChange={() => onStatusChange(sectionId, item.id, 'unsure')} className="accent-red-400 cursor-pointer scale-125 transition" title="Mark as Unsure" />
      </td>
      <td className="p-3 align-top text-center">
        <input type="checkbox" checked={!!item.status.revise} onChange={() => onStatusChange(sectionId, item.id, 'revise')} className="accent-yellow-400 cursor-pointer scale-125 transition" title="Mark for Revision" />
      </td>
      <td className="p-3 align-top text-center">
        <input type="checkbox" checked={!!item.status.confident} onChange={() => onStatusChange(sectionId, item.id, 'confident')} className="accent-green-500 cursor-pointer scale-125 transition" title="Mark as Confident" />
      </td>
      <td className="p-3 align-top text-center">
        <input type="checkbox" checked={!!item.status.practised} onChange={() => onStatusChange(sectionId, item.id, 'practised')} className="accent-blue-500 cursor-pointer scale-125 transition" title="Mark as Practised" />
      </td>
    </tr>
  );
}

export default App
