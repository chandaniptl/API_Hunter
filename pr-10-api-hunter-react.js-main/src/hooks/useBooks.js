import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'

const BOOK_URL = 'http://localhost:3000/books'

export const useBooks = () => {
  const [list, setList] = useState([])
  const [book, setBook] = useState({})
  const navigate = useNavigate()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const lastIndex = currentPage * itemsPerPage
  const firstIndex = lastIndex - itemsPerPage
  const currentItem = list.slice(firstIndex, lastIndex)
  const totalPage = Math.ceil(list.length / itemsPerPage)

  useEffect(() => {
    getBooks()
  }, [])

  const getBooks = async () => {
    const res = await axios.get(BOOK_URL)
    const fixed = res.data.map(b => ({
      ...b,
      borrowedBy: Array.isArray(b.borrowedBy) ? b.borrowedBy : [],
      count: Number(b.count) || 0,
      borrowed: b.borrowedBy?.length || 0
    }))
    setList(fixed)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setBook(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (book.id) {
      await axios.put(`${BOOK_URL}/${book.id}`, book)
    } else {
      await axios.post(BOOK_URL, {
        ...book,
        borrowedBy: [],
        borrowed: 0
      })
    }

    setBook({})
    getBooks()
    navigate('/admin/view-books')
  }

  const handleDelete = async (id) => {
    await axios.delete(`${BOOK_URL}/${id}`)
    getBooks()
  }

  const handleEdit = (id) => {
    const editData = list.find(b => b.id === id)
    setBook(editData)
    navigate('/admin/add-book')
  }

  const handleBorrowBook = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user?.id) return alert('Login first')

    const bookData = list.find(b => b.id === id)
    if (bookData.borrowedBy.includes(user.id))
      return alert('Already borrowed')

    if (bookData.borrowedBy.length >= bookData.count)
      return alert('Out of stock')

    const updated = {
      ...bookData,
      borrowedBy: [...bookData.borrowedBy, user.id],
      borrowed: bookData.borrowed + 1
    }

    await axios.put(`${BOOK_URL}/${id}`, updated)
    getBooks()
  }

  const handleReturnBook = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (!user?.id) return

    const bookData = list.find(b => b.id === id)
    const updated = {
      ...bookData,
      borrowedBy: bookData.borrowedBy.filter(uid => uid !== user.id),
      borrowed: bookData.borrowed - 1
    }

    await axios.put(`${BOOK_URL}/${id}`, updated)
    getBooks()
  }

  return {
    list,
    book,
    setBook,
    handleChange,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleBorrowBook,
    handleReturnBook,
    currentItem,
    currentPage,
    totalPage,
    setCurrentPage
  }
}
