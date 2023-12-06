var express = require('express');
var router = express.Router();
var bdTools = require(__base + 'objects/tools/dbTools.js');
var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');
 
// Connection URL
var url = 'mongodb://localhost:27017/queroingressos';
 
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  console.log("Ordem: "+__count++)
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {

	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);

		// Insert a single document
		db.collection(__configuration.mongo_evento).aggregate([{$group:{_id:"$classe",total:{$sum:1}}}]).toArray(function(err, docs) {
			if(!docs)
			{
				console.log(err);
			}
			else
			{
				var total = 0;
				
				docs.forEach(function(item)
				{
					total += item.total;
				});
				
				res.render('report', { title: 'Relatório de Validação' , total: total, validacoesClasse: docs, evento: __configuration.mongo_evento});
			}
		});
		
		db.close();
	});
	
	
});

module.exports = router;