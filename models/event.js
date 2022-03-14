const { Schema, model } = require('mongoose');

const EventSchema = Schema({
    name: {
        type: String,
        require: true
    },
    pictures: [{
        type: String,
        require: true
    }],
    date: {
        type: Date,
        require: true,
        default: Date.now

    },
    description: {
        type: String,
        require: true
    },
    town: {
        type: Schema.Types.ObjectId,
        ref: 'Town',
    }
}, { collection: 'events' });

EventSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();

    object.uid = _id;

    return object;
})

module.exports = model('Event', EventSchema);