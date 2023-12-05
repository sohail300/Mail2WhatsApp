import express from 'express';
import bodyParser from 'body-parser'
import apiRoute from './routes/api'

const app=express();

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}));

app.get('/', (req,res) => {
    res.send('Root Page');
    console.log('Root Page');
})

app.use('/api',apiRoute);

app.listen(3000, ()=>{
    console.log(`Server is listening at port 3000`);
})