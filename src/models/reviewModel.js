const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const reviewSchema = new mongoose.Schema({

    bookId: {
        type:ObjectId,
        required:true , 
        ref:'Book',
        trim:true
    },
    reviewedBy: {
        type:String,
         required:true,
         trim:true
          },
    reviewedAt: {
        type:Date,
    required:true
           },
    rating: {
        type:Number,
        required:true,
         //min 1, max 5
    },
    review:{ 
        type:String,
        trim:true  
        } ,  //Optional
    isDeleted: {
        type:Boolean, default: false
    }

}, { timestamps: true }
)
module.exports = mongoose.model('review', reviewSchema)