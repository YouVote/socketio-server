/* Generates random character in [0-9a-z] or string */

module.exports={
	genChar:function (){
		i=Math.floor(Math.random()*36);
		return (i>9?String.fromCharCode(i-10+97):i.toString());
	},

	genStr:function (len){
		s='';while(len--){s+=module.exports.genChar();}return s;
	}
}
