import { useState, useEffect } from 'react'
import { Plus, Search, BookOpen, Star, Check, X, Clock, BarChart2 } from 'lucide-react'

const ACCENT = '#0EA5E9'

type Status = 'reading' | 'finished' | 'want'

interface Book {
  id: string
  title: string
  author: string
  genre: string
  pages: number
  pagesRead: number
  status: Status
  rating: number
  notes: string
  startDate: string
  endDate: string
  added: string
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Mystery', 'Fantasy', 'Self-Help', 'Business', 'Other']

const STATUS_LABELS: Record<Status, string> = {
  reading: 'Reading',
  finished: 'Finished',
  want: 'Want to Read',
}

const STATUS_COLORS: Record<Status, string> = {
  reading: '#0EA5E9',
  finished: '#22C55E',
  want: '#F59E0B',
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => {
    try { return JSON.parse(localStorage.getItem('readinglog_books') || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'shelf' | 'stats'>('shelf')
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [form, setForm] = useState({ title: '', author: '', genre: 'Fiction', pages: '', status: 'want' as Status, notes: '' })

  useEffect(() => {
    localStorage.setItem('readinglog_books', JSON.stringify(books))
  }, [books])

  function openAdd() {
    setEditBook(null)
    setForm({ title: '', author: '', genre: 'Fiction', pages: '', status: 'want', notes: '' })
    setShowAdd(true)
  }

  function openEdit(book: Book) {
    setEditBook(book)
    setForm({ title: book.title, author: book.author, genre: book.genre, pages: String(book.pages), status: book.status, notes: book.notes })
    setShowAdd(true)
  }

  function saveBook() {
    if (!form.title.trim()) return
    if (editBook) {
      setBooks(prev => prev.map(b => b.id === editBook.id ? {
        ...b,
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre,
        pages: parseInt(form.pages) || 0,
        status: form.status,
        notes: form.notes.trim(),
        endDate: form.status === 'finished' && !b.endDate ? todayStr() : b.endDate,
        startDate: form.status === 'reading' && !b.startDate ? todayStr() : b.startDate,
      } : b))
    } else {
      const book: Book = {
        id: Date.now().toString(),
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre,
        pages: parseInt(form.pages) || 0,
        pagesRead: 0,
        status: form.status,
        rating: 0,
        notes: form.notes.trim(),
        startDate: form.status === 'reading' ? todayStr() : '',
        endDate: form.status === 'finished' ? todayStr() : '',
        added: todayStr(),
      }
      setBooks(prev => [book, ...prev])
    }
    setShowAdd(false)
  }

  function deleteBook(id: string) {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  function updateProgress(id: string, pagesRead: number) {
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b
      const done = b.pages > 0 && pagesRead >= b.pages
      return { ...b, pagesRead, status: done ? 'finished' : 'reading', endDate: done && !b.endDate ? todayStr() : b.endDate }
    }))
  }

  function setRating(id: string, rating: number) {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, rating } : b))
  }

  const filtered = books
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))

  // Stats
  const finished = books.filter(b => b.status === 'finished')
  const totalPages = finished.reduce((s, b) => s + b.pages, 0)
  const avgRating = finished.filter(b => b.rating > 0).length > 0
    ? (finished.filter(b => b.rating > 0).reduce((s, b) => s + b.rating, 0) / finished.filter(b => b.rating > 0).length).toFixed(1)
    : null
  const genreCounts: Record<string, number> = {}
  books.forEach(b => { genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1 })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#080E14', minHeight: '100vh', color: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#0D1520', padding: '20px 20px 0', borderBottom: '1px solid #152030' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={22} color={ACCENT} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Reading Log</div>
              <div style={{ fontSize: 11, color: '#555' }}>{books.length} books tracked</div>
            </div>
          </div>
          <button onClick={openAdd}
            style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus size={15} /> Add
          </button>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['shelf', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: tab === t ? ACCENT : '#555', fontWeight: tab === t ? 600 : 400, fontSize: 14, borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}` }}>
              {t === 'shelf' ? 'My Shelf' : 'Stats'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
        {tab === 'shelf' && (
          <>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={14} color="#555" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: '#0D1520', border: '1px solid #152030', borderRadius: 10, padding: '10px 12px 10px 34px', color: '#F5F5F5', fontSize: 14, boxSizing: 'border-box' }} />
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['all', 'reading', 'want', 'finished'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? ACCENT + '33' : '#0D1520', border: filter === f ? `1px solid ${ACCENT}` : '1px solid #152030', borderRadius: 8, padding: '5px 12px', color: filter === f ? ACCENT : '#777', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {f === 'all' ? 'All' : STATUS_LABELS[f]} <span style={{ color: '#555' }}>({books.filter(b => f === 'all' || b.status === f).length})</span>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#444', padding: '40px 0', fontSize: 14 }}>
                {books.length === 0 ? 'No books yet — tap Add to start' : 'No matching books'}
              </div>
            )}

            {filtered.map(book => {
              const pct = book.pages > 0 ? Math.round((book.pagesRead / book.pages) * 100) : 0
              return (
                <div key={book.id} style={{ background: '#0D1520', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid #152030' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: book.status === 'reading' ? 12 : 0 }}>
                    <div style={{ width: 40, height: 52, borderRadius: 6, background: ACCENT + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={18} color={ACCENT} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{book.title}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{book.author}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ background: STATUS_COLORS[book.status] + '22', color: STATUS_COLORS[book.status], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{STATUS_LABELS[book.status]}</span>
                        <span style={{ fontSize: 11, color: '#555' }}>{book.genre}</span>
                        {book.pages > 0 && <span style={{ fontSize: 11, color: '#555' }}>{book.pages}p</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(book)}
                        style={{ background: '#152030', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#888', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => deleteBook(book.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4 }}><X size={14} /></button>
                    </div>
                  </div>

                  {book.status === 'reading' && book.pages > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
                        <span>Progress</span>
                        <span>{book.pagesRead}/{book.pages} pages ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: '#152030', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', width: pct + '%', background: ACCENT, borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                      <input type="range" min={0} max={book.pages} value={book.pagesRead}
                        onChange={e => updateProgress(book.id, parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: ACCENT }} />
                    </div>
                  )}

                  {book.status === 'finished' && (
                    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(book.id, s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <Star size={16} fill={book.rating >= s ? '#F59E0B' : 'none'} color={book.rating >= s ? '#F59E0B' : '#333'} />
                        </button>
                      ))}
                    </div>
                  )}

                  {book.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 8, borderTop: '1px solid #152030', paddingTop: 8, lineHeight: 1.5 }}>{book.notes}</div>}
                </div>
              )
            })}
          </>
        )}

        {tab === 'stats' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Books Finished', finished.length, ACCENT],
                ['Pages Read', totalPages.toLocaleString(), '#22C55E'],
                ['Avg Rating', avgRating ? avgRating + '/5 ★' : '—', '#F59E0B'],
                ['Want to Read', books.filter(b => b.status === 'want').length, '#F97316'],
              ].map(([label, val, color]) => (
                <div key={label as string} style={{ background: '#0D1520', borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: '1px solid #152030' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: color as string }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Reading by genre */}
            <div style={{ background: '#0D1520', borderRadius: 16, padding: 18, marginBottom: 16, border: '1px solid #152030' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Books by Genre</div>
              {Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([genre, count]) => {
                const maxCount = Math.max(...Object.values(genreCounts))
                return (
                  <div key={genre} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#888', width: 80, textAlign: 'right' }}>{genre}</span>
                    <div style={{ flex: 1, height: 8, background: '#152030', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: (count / maxCount * 100) + '%', background: ACCENT, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#888', width: 16 }}>{count}</span>
                  </div>
                )
              })}
              {Object.keys(genreCounts).length === 0 && <div style={{ color: '#444', fontSize: 13, textAlign: 'center' }}>No data yet</div>}
            </div>

            {/* Top rated */}
            {finished.filter(b => b.rating > 0).length > 0 && (
              <div style={{ background: '#0D1520', borderRadius: 16, padding: 18, border: '1px solid #152030' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top Rated</div>
                {finished.filter(b => b.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 5).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #152030', fontSize: 13 }}>
                    <span style={{ color: '#ccc' }}>{b.title}</span>
                    <span style={{ color: '#F59E0B' }}>{'★'.repeat(b.rating)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ background: '#0D1520', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{editBook ? 'Edit Book' : 'Add Book'}</span>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>
            <input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ width: '100%', background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            <input placeholder="Author" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
              style={{ width: '100%', background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <select value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                style={{ background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14 }}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
              <input placeholder="Pages" type="number" value={form.pages} onChange={e => setForm(p => ({ ...p, pages: e.target.value }))}
                style={{ background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14 }} />
            </div>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))}
              style={{ width: '100%', background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} style={{ width: '100%', background: '#152030', border: 'none', borderRadius: 10, padding: '12px', color: '#F5F5F5', fontSize: 14, resize: 'none', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, background: '#152030', border: 'none', borderRadius: 12, padding: '13px', color: '#888', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveBook}
                style={{ flex: 2, background: ACCENT, border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {editBook ? 'Save Changes' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
