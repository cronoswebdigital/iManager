var express = require('express');
var router = express.Router();
var bdTools = require(__base + 'objects/tools/dbTools.js');
var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');
var http = require('http');

// Connection URL
var url = 'mongodb://localhost:27017/queroingressos';
 
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  console.log("Ordem: "+__count++)
  next();
});

/*test route*/
router.post('/isOk', function(req, res, next)
{
	res.json({is:"OK"});
});

/* GET home page. */
router.get('/', function(req, res, next) {
	
	MongoClient.connect(url, function(err, db) {
		var collection = db.collection(__configuration.mongo_evento);
		var indices = ["classe","codBar"];
		
		indices.forEach(function(row)
		{
			collection.indexExists(row+"_1", function(err, result) {
			if(result == false)
			{
				collection.createIndex([[row, 1]], function(err, index){
					console.log(err);
					console.log("Indice criado no banco com nome: "+index);
					db.close();	
				});
			}
			else
			{
				db.close();	
			}
		});
		});
		
	});
	
	queryDBS( "select NOMEPDA, APELIDO from PDA")
	.then(
		// success
		function(rs) {
			
			var terminaisList = [{value:'SELECIONE',name:'SELECIONE'}];
		
			
			 rs.forEach( function(row){
				var terminal = {};
				terminal.value = bufferToStr(row.NOMEPDA);
				terminal.name = bufferToStr(row.APELIDO);
				terminaisList.push(terminal);
			 });
			
			res.render('terminal', { title: 'Validação Móvel' , terminais: terminaisList});
		},
		// fail
		function(err)  {
			console.log('error'+err);
			res.json({respCode: statusCode});
		});
});

/* GET home page. */
router.get('/terminais', function(req, res, next) {
	
	queryDBS( "select NOMEPDA, APELIDO from PDA")
	.then(
		// success
		function(rs) {
			
			var terminaisList = [];
		
			rs.forEach( function(row){
				var terminal = {};
				terminal.value = bufferToStr(row.NOMEPDA);
				terminal.name = bufferToStr(row.APELIDO);
				terminaisList.push(terminal);
			});
			
			res.json(terminaisList);
		},
		// fail
		function(err)  {
			console.log('error'+err);
			res.json({respCode: statusCode});
		});
});

/* pagina de validação. */
router.get('/validacao/:terminal', function(req, res, next) {
	
	/*
		REnderiza a pagina de validação para aquele terminal
	*/
	queryDBS( "select APELIDO from PDA where NOMEPDA like ?",[req.params.terminal])
	.then(
		// success
		function(rs) {
			
			var terminal = {};
			
			 rs.forEach( function(row){
				
				terminal.name = bufferToStr(row.APELIDO);
			 });
			
				 
			res.render('index', { title: terminal.name , terminal: req.params.terminal});
		},
		// fail
		function(err)  {
			console.log('error'+err);
			res.json({respCode: statusCode});
		});
	
});

/* valida cod barras. */
router.post('/validate', function(req, res, next) {
	var codigoBarras = req.body.code+"";
	var pdaNm = req.body.pda+"";
	var pdaName = req.body.name;
	
	var ticket = {};
	
	//verifica se o ticket está na base mongo
	
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		// Insert a single document
		db.collection(__configuration.mongo_evento).findOne({codBar: codigoBarras}, function(err, document) {
			if(!document)
			{
				queryDBS( "select INGRESSO.STATUS, CAST(EVENTO_CLASSE.ID AS VARCHAR(10)) AS CLASSE, INGRESSO.NM_CLASSE FROM INGRESSO INNER JOIN EVENTO_CLASSE ON EVENTO_CLASSE.COD_CLASSE = INGRESSO.ID_CLASSE where CODBARRA like ?",[codigoBarras])
				.then(
					  // success
					function(rs) 
					{
						rs.forEach( function(row)
						{
							ticket.code = bufferToStr(row.STATUS);
							ticket.idClasse = bufferToStr(row.CLASSE);
							ticket.nmClasse = bufferToStr(row.NM_CLASSE);
						});
						if(ticket.code == '1')
						{
							//acha o terminal de validação e verifica se está no terminal correto
							queryDBS( "select * FROM PDA_CLASSE where ID_CLASSE = ? and NMPDA like ?", [ticket.idClasse, pdaNm])
								.then(
									// success
									function(rs) {
										if(rs.length == 0)
										{
											//envia a resposta que o ingresso está errado
											db.close();
											res.json({respCode: "99"});
										}
										else
										{
											rs.forEach( function(row)
											{
												//insere novo registro no mongo
												assert.equal(null, err);
												// Insert a single document
												db.collection(__configuration.mongo_evento).insertOne({codBar:codigoBarras, terminal:pdaName, classe: ticket.nmClasse, dataHora: new Date(), respCode: '9'}, function(err, r) {
													assert.equal(null, err);
													assert.equal(1, r.insertedCount);
												});
												//db.close();
												res.json({respCode: '91', classe: ticket.nmClasse});
												
											});
										}
										
									},
								  // fail
									function(err)  
									{
										console.log('error'+err);
										db.close();
										res.json({respCode: ticket.code});
									});	   
						}
						else
						{
							if(typeof ticket.code == 'undefined')
							{
								db.close();
								res.json({respCode: "undefined"});
							}
							else
							{
								db.close();
								res.json({respCode: ticket.code});
							}
						} 
					},
					// fail
					function(err)  {
						console.log('error'+err);
						db.close();
						res.json({respCode: "undefined"});
					}
				   );
			}
			else
			{
				var ret = document;
				if(document.dataHora != null || document.dataHora != 'null')
				{
					var date = new Date(document.dataHora);
					ret.dataHora = ("0" + date.getDate()).slice(-2)+'/'+("0" + (date.getMonth()+1)).slice(-2)+' '+("0" + date.getHours()).slice(-2)+':'+("0" + date.getMinutes()).slice(-2)+':'+("0" + date.getSeconds()).slice(-2)+'Hs';
				}
				db.close();
				res.json(ret);
			}
		});
	});
});

module.exports = router;