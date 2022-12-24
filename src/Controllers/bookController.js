const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const reviewModel = require("../models/reviewModel")
const mongoose = require('mongoose')
const moment = require('moment')

const { isValid, isValidRequestBody, validDate, validISBN, isValidfild } = require("../validator/validation")

const createBook = async function (req, res) {
    try {
        const data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: " body cant't be empty Please enter some data." })

        const { title, excerpt, userId, ISBN, category, subcategory, reviews, isDeleted, releasedAt ,bookCover} = data

        //------------------------------Authorization----------------------//

        const authUserId = req.authUser
        if (authUserId != userId) return res.status(403).send({ status: false, message: `${userId} This ID is not authorized` })

        //----------------------------Authorization------------------------//
        if (!isValid(title)) return res.status(400).send({ status: false, message: "Title is required" })
        if (!isValid(excerpt)) return res.status(400).send({ status: false, message: "excerpt is  required" })
        if (!isValid(userId)) return res.status(400).send({ status: false, message: "userId id is required" })
        if (!isValid(ISBN)) return res.status(400).send({ status: false, message: " ISBN is required" })
        if (!isValid(category)) return res.status(400).send({ status: false, message: "category is required" })
        if (!isValid(subcategory)) return res.status(400).send({ status: false, message: "subcategory is required" })
       if (!isValid(bookCover)) return res.status(400).send({ status: false, message: "book cover is required" })

        if (!mongoose.isValidObjectId(userId)) return res.status(406).send({ status: false, message: "userId is not in correct format" })
        const validUser = await userModel.findById(userId)
        if (!validUser) return res.status(400).send({ status: false, message: `user not found by this ${userId} userId ` })

        if (!validISBN.test(ISBN)) return res.status(406).send({ status: false, message: 'Please enter valid ISBN' })

        const unique = await bookModel.findOne({ $or: [{ title: title }, { ISBN: ISBN }] })
        if (unique) {
            if (unique.title == title.trim()) {
                return res.status(400).send({ message: `${title} is  already exist` }) //instead of 400 we can also use 409 for conflict
            } else { return res.status(400).send({ message: `${ISBN}:--This ISBN is already exist  ` }) } //instead of 400 we can also use 409 for conflict

        }


        if (releasedAt) {
            if (!validDate.test(releasedAt)) return res.status(406).send({ status: false, message: 'Please enter a  release Date YYYY-MM-DD format' })
        } else { data["releasedAt"] = moment().format('YYYY MM DD') }

        if (reviews) return res.status(406).send({ status: false, message: 'default value of reviews is 0 while book registering' })


        if (isDeleted == true) return res.status(400).send({ status: false, message: "you can't delete a book while creating" })

        const book = await bookModel.create(data)
        res.status(201).send({ status: true, message: "Boook successfully created", data: book })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }


}



const getBooks = async function (req, res) {
    try {
        let data = req.query

        const { userId, category, subcategory } = data

        if (userId) {
            if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter a correct userId" })
        }

        const getBook = { isDeleted: false }
        if (userId) getBook["userId"] = userId
        if (category) getBook["category"] = category
        if (subcategory) getBook["subcategory"] = subcategory

        if (data.isDeleted == true) return res.status(404).send({ status: false, message: "you can't find deleted books" })



        const books = await bookModel.find(getBook).select({ id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })
        books.sort((a, b) => {
            let fa = a.title.toLowerCase()
            fb = b.title.toLowerCase()
            if (fa < fb) return -1;
            if (fa > fb) return 1;
            return 0
        })

        if (books.length == 0) return res.status(404).send({ status: false, message: "Book Not Found " })

        res.status(200).send({ status: true, message: "Books List", data: books })

    }

    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

// --------------------------------------------------------------------------------

const booksById = async function (req, res) {
    try {
        let id = req.params.bookId

        if (!mongoose.isValidObjectId(id)) return res.status(400).send({ status: false, message: "please enter a correct Id" })

        const findById = {
            _id: id,
            isDeleted: false
        }
        const findBook = await bookModel.findOne(findById).select({ __v: 0 })
        if (!findBook) return res.status(404).send({ status: false, message: "book's not found" })
        const findreviews = await reviewModel.find({ bookId: findById, isDeleted: false })
        if (findBook.reviews != 0) {
            findBook._doc["reviewsData"] = findreviews
        } else {
            findBook._doc["reviewsData"] = []
        }
        res.status(200).send({ status: true, message: `I got This book by using this Id ==>>${id}`, data: findBook })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}


const updateBook = async function (req, res) {
    try {

        const data = req.body
        const { title, excerpt, releasedAt, ISBN } = data

        let id = req.params.bookId
        if (!mongoose.isValidObjectId(id)) return res.status(400).send({ status: false, message: "please enter a correct userId" })
        //------------------------------Authorization----------------------//
        const bookUser = await bookModel.findById(id)
        if (!bookUser) return res.status(404).send({ status: false, msg: "Invalid BookId" })

        const authUserId = req.authUser
        if (authUserId != bookUser.userId) return res.status(403).send({ status: false, message: " UnAuthorized User" })

        //----------------------------Authorization------------------------//

        
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: " body cant't be empty Please enter some data." })

        if (!isValidfild(ISBN)) return res.status(400).send({ status: false, message: " ISBN is required" })
        if (!isValidfild(title)) return res.status(400).send({ status: false, message: "Title is required" })
        if (!isValidfild(excerpt)) return res.status(400).send({ status: false, message: "excerpt is  required" })

        if (ISBN) {
            if (!validISBN.test(ISBN)) return res.status(406).send({ status: false, message: 'Plese enter valid ISBN' })
        }

        const unique = await bookModel.findOne({ $or: [{ title: title }, { ISBN: ISBN }] })

        if (unique) {
            if (unique.title == title.trim()) {
                return res.status(400).send({ message: `${title} is  alrady exist` })
            } else { return res.status(400).send({ message: `${ISBN}:--This ISBN is alrady exist  ` }) }
        }

        if (releasedAt) {
            if (!validDate.test(releasedAt)) return res.status(406).send({ status: false, message: 'Plese enter a  release Date YYYY-MM-DD format' })
        }

        const newUpdate = await bookModel.findOneAndUpdate({ bookId: id, isDeleted: false }, { $set: { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN } }, { new: true })

        if (!newUpdate) { return res.status(404).send({ status: false, message: "book not found so can't update anything" }) }

        res.status(200).send({ status: true, message: "updated successfully", data: newUpdate })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

const deleteBook = async function (req, res) {
    try {
        let bookId = req.params.bookId

        if (!mongoose.isValidObjectId(bookId)) { return res.status(400).send({ status: false, msg: "bookId is not in correct format" }) }

        let bookVerify = await bookModel.findById(bookId)
        if (!bookVerify) {
            return res.status(404).send({ status: false, msg: "Invalid BookId" })
        }
        //------------------------------Authorization----------------------//

        const authUserId = req.authUser
        if (authUserId != bookVerify.userId) return res.status(403).send({ status: false, message: " UnAuthorized User" })

        //----------------------------Authorization------------------------//


        if (bookVerify.isDeleted) {
            return res.status(404).send({ status: false, msg: "Book already deleted" })
        }

        let record = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        res.status(200).send({ status: true, message: "Book Deleted successfully" })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createBook, getBooks, booksById, updateBook, deleteBook }