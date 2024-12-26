const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xj6bm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



        // artifacts related APIs
        const artifactsCollection = client.db('historicalArtifacts').collection('artifacts');

        app.get('/artifacts', async (req, res) => {
            // 
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { addedBy: email }
            }

            const cursor = artifactsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/featured/artifacts', async (req, res) => {
            const cursor = artifactsCollection.find({}).sort({ likeCount: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/artifacts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await artifactsCollection.findOne(query);
            res.send(result);
        });

        // add artifact
        app.post('/artifacts', async (req, res) => {
            const newArtifact = req.body;
            const artifactLikeDefault = {
                ...newArtifact,
                likeCount: 0,
            }
            // console.log(artifactLikeDefault);
            const result = await artifactsCollection.insertOne(artifactLikeDefault);
            res.status(201).send(result);
        });



        // // like btn functionality
        // app.put("/artifacts/:id/like", async (req, res) => {
        //     const artifactId = req.params.id;
        //     const { userId } = req.body;

        //     try {
        //         await client.connect();
        //         const database = client.db("historical_artifacts");
        //         const artifactsCollection = database.collection("artifacts");

                
        //         const artifact = await artifactsCollection.findOne({ _id: new ObjectId(artifactId) });

        //         if (!artifact) {
        //             return res.status(404).json({ message: "Artifact not found" });
        //         }

        //         const alreadyLiked = artifact.likedBy.includes(userId);

                
        //         const update = alreadyLiked
        //             ? {
        //                 $inc: { likes: -1 },
        //                 $pull: { likedBy: userId },
        //             }
        //             : {
        //                 $inc: { likes: 1 },
        //                 $push: { likedBy: userId },
        //             };

        //         await artifactsCollection.updateOne({ _id: new ObjectId(artifactId) }, update);

        //         res.status(200).json({
        //             message: alreadyLiked ? "Like removed" : "Artifact liked",
        //         });
        //     } catch (error) {
        //         res.status(500).json({ message: "An error occurred", error: error.message });
        //     } finally {
        //         await client.close();
        //     }
        // });



        // UPDATE
        app.put('/artifacts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedArtifact = req.body;
            const result = await artifactsCollection.updateOne(filter, { $set: updatedArtifact }, options);
            res.send(result)
        })

        // DELETE
        app.delete('/artifacts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await artifactsCollection.deleteOne(query);
            res.send(result);
        });




    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Historical Artifacts server is running')
})

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`)
})