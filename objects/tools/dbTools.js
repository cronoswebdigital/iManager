
var fb = require("node-firebird");  // firebird lib
var q = require('q');             // promises lib
var db;
var cfg;                            // cfg object  

cfg =
{
   host: __configuration.fb_host,
   port: 3050,
   database: __configuration.fb_db,
   user: 'SYSDBA',
   password: 'masterkey'
};

/*------------------------------ CONNECT/DISCONNECT -------------------------------*/
connectToDB = function (acfg){
   var def = q.defer();
   fb.attach( acfg,
      function(err, db){
         err ? def.reject(err) : def.resolve(db);
      }
   );
   return def.promise;
};

disconnectFromDB = function() {
   db.detach(
      function(){
         console.log('disconect from DB: database detached');
      }
   );
};

/*------------------------------ QUERY -------------------------------*/

queryDBS = function(sql, params){
	var promiseCompleted = false;
	var def = q.defer();
	if(typeof db == 'undefined')
	{
		connectToDB(cfg).then(
		// success
		function(dbconn){
				
			 db = dbconn;
			 db.query(sql,params,
			 function(err, rs){
				err ? def.reject(err) : def.resolve(rs);
			 });
		},
		  // fail
		  function(err)  {
			 console.log(err);
		  }
	   );
	}
	else
	{
		nferr = true;
		q.delay(3000).then(function () {
			if(!promiseCompleted)
			{
				connectToDB(cfg).then(
				// success
				function(dbconn){
					 db = dbconn;
					 db.query(sql,params,
					 function(err, rs){
						err ? def.reject(err) : def.resolve(rs);
					 });
				},
				  // fail
				  function(err)  {
					 console.log(err);
				  }
			   );
			}
		});
		
		db.query(sql,params,
			function(err, rs)
			{
				promiseCompleted = true;
				err ? def.reject(err) : def.resolve(rs);
			});
	}
	

   return def.promise;
};


/*------------------------------ UTILITY -------------------------------*/
bufferToStr = function (buf) {
   return String.fromCharCode.apply(null, new Uint16Array(buf));
}
bufferToInt = function (buf) {
   return new DataView(buffer, 0).getInt16();
}
strToBufer = function (str) {
   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
   var bufView = new Uint16Array(buf);
   for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
   }
   return buf;
}