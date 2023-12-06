
var timeouts;
var barCode;
//var baseUrl = '/validate';
var timeMilis = 1000;
var baseUrl = 'http://127.0.0.1:3000/validate';
$( document ).ready(function() {
    $("#code").focus();
	$("#code").on('input change',function(e)
	{
		if($(this).val().length >= 12)
		{
			clearTimeout(timeouts);
			barCode = $(this).val();
			$(this).val("");
			if(barCode.length > 12)
			{
				barCode = barCode.substr(0,12);
			}
			var pdaNm = $("#terminal").val();
			var terminalName = $("#terminalName").val();
			
			
			$.ajax({url:baseUrl,
			contentType : 'application/json',
			data:JSON.stringify({code: barCode, pda: pdaNm, name:terminalName}),
			type:"POST",
			crossDomain: true
			}).done(function(data)
			{
				receiveResp(data);
			});
			//sendRequest('http://localhost:8167/QIWS/validate',receiveResp,{code: barCode, pda: pdaNm, name:terminalName});
			
		}
	});
	
	$("#terminal").change(function()
	{
		var nomepda = $(this).val();
		if(nomepda != 'SELECIONE')
		{
			window.location.replace(window.location.href+'validacao/'+nomepda);
		}
	});
	
	$("#wrap").on('click', function(){
		$("#code").focus();
	});
});


function receiveResp(data) 
{
	var html;
	estatus = data.respCode;
	var classe = data.classe;
	var dateTime = data.dataHora;
	var pdaName = data.terminal;
	/*ENUM
	*undefined = não encontrado
	*1 = não foi possivel validar
	*3 = cancelado
	*0 = ??
	*91 = validado com sucesso
	*99 = valido mas está no terminal de checkin errado
	*/
	
	if(typeof estatus == 'undefined')
	{
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-red");
		
		html = '<div class="error"> Ingresso '+barCode+' não encontrado </div>';
	}
	else if(estatus == '91')
	{
		backToNormal();
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-green");
		
		html = '<div class="success"> '+barCode+'</br> '+classe+' </div>';
	}
	else if(estatus == '99')
	{
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-yellow");
		
		html = '<div class="info"> Dirija-se ao checkin correto. </div>';
	}
	else if(estatus == '9')
	{
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-yellow");
		html = '<div class="warning">Ingresso '+barCode+' validado em: '+ dateTime
		+' por '+pdaName+'</div>';
	}
	else if(estatus == '1' || estatus == barCode || estatus == '0')
	{
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-red");
		
		html = '<div class="info"> Não foi possível validar o ingresso '+barCode+' </div>';
	}
	else if(estatus == '3')
	{
		timeouts = setTimeout(backToNormal, timeMilis);
		backToNormal();
		$("#wrap").addClass("w3-red");
		
		html = '<div class="error"> Ingresso '+barCode+' cancelado. </div>';
	}
	$("#code").val("");
	$( "#history" ).prepend($( "#response" ).html());
	$( "#response" ).html( html );
	$("#code").focus();
	
	
}


function sendRequest(url,callback,postData) {
    var req = createXMLHTTPObject();
    if (!req) return;
    var method = (postData) ? "POST" : "GET";
    req.open(method,url,true);
	req.setRequestHeader('Accept', 'application/json');
	req.setRequestHeader('Access-Control-Request-Headers', 'X-Requested-With');
	req.setRequestHeader('Access-Control-Request-Method', 'POST');
    if (postData)
        req.setRequestHeader('Content-type','application/json');
    req.onreadystatechange = function () {
        if (req.readyState != 4) return;
        if (req.status != 200 && req.status != 304) {
//          alert('HTTP error ' + req.status);
            return;
        }
        callback(JSON.parse(req.responseText));
    }
    if (req.readyState == 4) return;
    req.send(JSON.stringify(postData));
}

var XMLHttpFactories = [
    function () {return new XMLHttpRequest()},
    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
];

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i=0;i<XMLHttpFactories.length;i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}

function backToNormal()
{
	$("#wrap").removeClass("w3-yellow");
	$("#wrap").removeClass("w3-red");
	$("#wrap").removeClass("w3-green");
	$( "#history" ).prepend($( "#response" ).html());
	$( "#response" ).html( "" );
}


/*HACK PRO IE6 */
function validaCodigo()
{
	var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    if (msie < 0) // If Internet Explorer, return version number
    {
		return;
	}
	if($("#code").val().length >= 12)
	{
	
		clearTimeout(timeouts);
		barCode = $(this).val();
		if(barCode.length > 12)
		{
			barCode = barCode.substr(0,12);
		}
		var pdaNm = $("#terminal").val();
		var terminalName = $("#terminalName").val();
		//192.168.0.14
		$.ajax({url: baseUrl,
		contentType : 'application/json',
		data:JSON.stringify({code: barCode, pda: pdaNm, name:terminalName}),
		type:"POST"
		}).done(function(data)
		{
			receiveResp(data);
		});
		
	}
}
