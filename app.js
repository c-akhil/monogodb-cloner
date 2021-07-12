let urlSource = "mongodb+srv://user:password@mongodb.net/oldDatabaseName?retryWrites=true&w=majority";
let dbSource = "oldDatabaseName";

let MongoClientSource = require('mongodb').MongoClient;

let urlTarget = "mongodb+srv://user:password@mongodb.net/newDatabaseName?retryWrites=true&w=majority";
let dbTarget = "newDatabaseName";

let MongoClientTarget = require('mongodb').MongoClient;

let collectionList = [
    'collection1',
    'collection2',
    'collection3',
    'collection4'
];

let chunks = 100000000;
let timeOut = 10000;

collectionList.forEach(collectionName => {
    let collectionSource = collectionName;
    let collectionTarget = collectionName;
    function copyDocumentsInChunks(skip, limit, count) {
        if (skip >= count) {
            console.log("Ended!");
            process.exit(); // Replace this line with "return;" if there is a trouble
        }
        console.log("Written " + skip + " of " + count + " documents");
        MongoClientSource.connect(urlSource, { useNewUrlParser: true }, function (error, mongo) {
            if (error) throw error;

            let db = mongo.db(dbSource);
            db.collection(collectionSource).find({}).sort({ _id: 1 }).skip(skip).limit(limit).toArray(function (err, result) {
                if (err) throw err;

                insertDocuments(result);
                setTimeout(copyDocumentsInChunks, timeOut, skip + limit, limit, count);
                //copyDocumentsInChunks(skip + limit, limit, count);
                mongo.close();
            });
        });
    }
    function insertDocuments(documents) {
        MongoClientTarget.connect(urlTarget, { useNewUrlParser: true }, function (error, mongo) {
            if (error) throw error;

            let db = mongo.db(dbTarget);
            db.collection(collectionTarget).insertMany(documents, function (err, result) {
                if (err) throw err;
                mongo.close();
            });
        });
    }
    function countDocumentsDBSource(callback, limit) {
        MongoClientSource.connect(urlSource, { useNewUrlParser: true }, function (error, mongo) {
            if (error) throw error;

            let db = mongo.db(dbSource);
            db.collection(collectionSource).countDocuments().then((count) => {
                callback(0, limit, count);
                mongo.close();
            });
        });
    }
    countDocumentsDBSource(copyDocumentsInChunks, chunks);
})