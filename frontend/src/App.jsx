import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api/expenses'
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other']

const getToday = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

const emptyForm = () => ({ title: '', amount: '', category: 'Food', date: getToday() })

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
})

const readableDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function App() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    axios
      .get(API_URL)
      .then(({ data }) => {
        if (active) setExpenses(data)
      })
      .catch(() => {
        if (active) setLoadError('Could not connect to the server. Check that the backend is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const refreshExpenses = async () => {
    const { data } = await axios.get(API_URL)
    setExpenses(data)
    setLoadError('')
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = { ...form, title: form.title.trim(), amount: Number(form.amount) }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload)
        setNotice({ type: 'success', text: 'Expense updated successfully.' })
      } else {
        await axios.post(API_URL, payload)
        setNotice({ type: 'success', text: 'Expense added successfully.' })
      }

      await refreshExpenses()
      setForm(emptyForm())
      setEditingId(null)
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || 'Could not save this expense. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (expense) => {
    setEditingId(expense._id)
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10),
    })
    setNotice(null)
    document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete “${expense.title}” from your expenses?`)
    if (!confirmed) return

    setNotice(null)
    try {
      await axios.delete(`${API_URL}/${expense._id}`)
      await refreshExpenses()
      if (editingId === expense._id) {
        setEditingId(null)
        setForm(emptyForm())
      }
      setNotice({ type: 'success', text: 'Expense deleted successfully.' })
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || 'Could not delete this expense. Please try again.',
      })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm())
    setNotice(null)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Expense tracker home">
          <span className="brand-mark" aria-hidden="true">₹</span>
          <span>DAYBOOK</span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Personal finance</span>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow">YOUR MONEY, IN FOCUS</p>
          <h1>Personal Expense Tracker</h1>
          <p className="intro-text">A little more clarity in every rupee.</p>
        </div>
        <aside className="summary" aria-label="Expense summary">
          <div className="summary-topline">
            <span className="summary-label">TOTAL SPENDING</span>
            <span className="summary-mark" aria-hidden="true">↗</span>
          </div>
          <p className="summary-total">{currency.format(total)}</p>
          <div className="summary-bottomline">
            <span>Across all expenses</span>
            <span className="transaction-count"><strong>{expenses.length}</strong> {expenses.length === 1 ? 'transaction' : 'transactions'}</span>
          </div>
        </aside>
      </section>

      {notice && (
        <div className={`notice notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button className="notice-dismiss" type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" title="Dismiss">×</button>
        </div>
      )}

      <div className="workspace">
        <section className="form-panel panel" aria-labelledby="form-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? 'MAKE A CHANGE' : 'NEW ENTRY'}</p>
              <h2 id="form-heading">{editingId ? 'Edit expense' : 'Add an expense'}</h2>
            </div>
            <span className="heading-icon" aria-hidden="true">{editingId ? '↗' : '+'}</span>
          </div>

          <form id="expense-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="title">What was it for?</label>
            <input id="title" name="title" type="text" placeholder="e.g. Lunch with friends" value={form.title} onChange={handleChange} maxLength={100} required />

            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="amount">Amount</label>
                <div className="amount-input">
                  <span aria-hidden="true">₹</span>
                  <input id="amount" name="amount" type="number" placeholder="0.00" value={form.amount} onChange={handleChange} min="0.01" step="0.01" required />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="date">Date</label>
                <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
              </div>
            </div>

            <label className="field-label" htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} required>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>
                <span aria-hidden="true">{saving ? '…' : editingId ? '✓' : '+'}</span>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'}
              </button>
              {editingId && <button className="text-button" type="button" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="history-panel panel" aria-labelledby="history-heading">
          <div className="history-heading panel-heading">
            <div>
              <p className="eyebrow">YOUR RECORD</p>
              <h2 id="history-heading">Expense history</h2>
            </div>
            <span className="history-count">{expenses.length.toString().padStart(2, '0')} <span>entries</span></span>
          </div>

          <div className="expense-list" aria-live="polite">
            {loading ? (
              <div className="state-message" role="status"><span className="loader" /> Loading your expenses…</div>
            ) : loadError ? (
              <div className="state-message state-error">
                <p>{loadError}</p>
                <button className="text-button" type="button" onClick={async () => {
                  setLoading(true)
                  try {
                    await refreshExpenses()
                  } catch {
                    setLoadError('Could not connect to the server. Check that the backend is running.')
                  } finally {
                    setLoading(false)
                  }
                }}>Try again</button>
              </div>
            ) : expenses.length === 0 ? (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">₹</span>
                <h3>A fresh start</h3>
                <p>Your expenses will show up here once you add the first one.</p>
              </div>
            ) : (
              <>
                <div className="list-labels" aria-hidden="true">
                  <span /><span>EXPENSE</span><span>DATE</span><span>AMOUNT</span><span />
                </div>
                {expenses.map((expense) => (
                  <article className="expense-row" key={expense._id}>
                    <div className={`category-icon category-${expense.category.toLowerCase()}`} aria-hidden="true">{expense.category.slice(0, 1)}</div>
                    <div className="expense-description">
                      <h3>{expense.title}</h3>
                      <span className={`category-tag tag-${expense.category.toLowerCase()}`}>{expense.category}</span>
                    </div>
                    <time className="expense-date" dateTime={new Date(expense.date).toISOString()}>{readableDate(expense.date)}</time>
                    <strong className="expense-amount">{currency.format(Number(expense.amount))}</strong>
                    <div className="row-actions">
                      <button className="icon-button edit-button" type="button" onClick={() => handleEdit(expense)} aria-label={`Edit ${expense.title}`} title="Edit expense">↗</button>
                      <button className="icon-button delete-button" type="button" onClick={() => handleDelete(expense)} aria-label={`Delete ${expense.title}`} title="Delete expense">×</button>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
          {!loading && !loadError && expenses.length > 0 && (
            <div className="list-footer"><span>Showing all expenses</span><span>Newest first</span></div>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <span>DAYBOOK <span className="footer-separator">/</span> PERSONAL EXPENSE TRACKER</span>
        <span>Every rupee, accounted for.</span>
      </footer>
    </main>
  )
}

export default App
