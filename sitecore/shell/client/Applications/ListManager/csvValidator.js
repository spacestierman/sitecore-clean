define(function () {
  
  var validator =  {
     hasNoContent: function (file) {
      var lineEnding = this.guessLineEnding(file);

      var lines = file.split(lineEnding);

      if(lines.length <2) {
        return true;
      }

      for(var i = 1; i<lines.length; i++){
        if(lines[i].trim().length>0) {
          return false;
        }
      }
     
      return true;
    },
    guessLineEnding: function (input) {
      input = input.substr(0, 1024 * 1024);	// max length 1 MB

      var r = input.split('\r');

      var n = input.split('\n');

      var nAppearsFirst = (n.length > 1 && n[0].length < r[0].length);

      if (r.length === 1 || nAppearsFirst)
        return '\n';

      var numWithN = 0;
      for (var i = 0; i < r.length; i++) {
        if (r[i][0] === '\n')
          numWithN++;
      }

      return numWithN >= r.length / 2 ? '\r\n' : '\r';
    }
  };

  return validator;
});