  function BN(n) {
    n = n.toString();
    this.strNum = n;
    this.matrix = BN.strToMatrix(n);
  }

  BN.CHUNK_SIZE = 10;

  BN.to_i = function(str) { return parseInt(str, 10) ; };

  BN.getStrValue = function(n) {
    return (n instanceof BN)? n.strNum : String(n);
  }

  BN.get_z = function(n) {
    var str = '';
    for(var i=0; i<n; i++) str += '0';
    return str;
  };

  BN.strToMatrix = function(str) {
    var matrix = []
      , chunk = [];

    for(var i=(str.length - 1); i>=0; i--) {
      if(chunk.length >= BN.CHUNK_SIZE) {
        matrix.push(chunk);
        chunk = [BN.to_i(str[i])];
      } else {
        chunk.push(BN.to_i(str[i]));
      }
    }
    matrix.push(chunk);
    return matrix;
  }

  BN.matrixToStr = function(matrix, revert) {
    var str = '';
    for(var i=0, l=matrix.length; i<l; i++) {
      for(var j=0, d=matrix[i].length; j<d; j++) {
        if(!revert) {
          str = matrix[i][j].toString() + str;
        } else {
          str += matrix[i][j];
        }
      }
    }
    return str;
  };

  BN.getDigitsLength = function(matrix) {
    var last = matrix.length - 1;
    return matrix[last].length + (last * BN.CHUNK_SIZE);
  }

  BN._maxStr = function(s0, s1) {
    s0 = BN.getStrValue(s0);
    s1 = BN.getStrValue(s1);

    if(s0 === s1) return s0;

    var n0
      , n1;

    if(s0.length === s1.length) {
      for(var i=0, l=s0.length; i<l; i++) {
        n0 = BN.to_i(s0[i]);
        n1 = BN.to_i(s1[i]);
        if(n0 !== n1) return (n0 > n1)? s0 : s1;
      }
    } else {
      return (s0.length > s1.length)? s0 : s1;
    }
  }
  BN.max = function(s0, s1) { return new BN(BN._maxStr(s0, s1)); };
  BN.min = function(s0, s1) { return BN._maxStr(s0, s1) === s0? new BN(s1) : new BN(s0); };

  BN.multiplyMatrix = function(matrix, n) {
    if(n === 0) {
      matrix = [[0]];
      return matrix;
    }
    if(n === 1) return matrix;

    var rem = 0, tmp;
    for(var i=0, l=matrix.length; i<l; i++) {
      for(var j=0, d=matrix[i].length; j<d; j++) {
        var num = matrix[i][j] * n + rem;
        if(num >= 10) {
          tmp = num.toString().split('');
          matrix[i][j] = BN.to_i(tmp[1]);
          rem = BN.to_i(tmp[0]);
        } else {
          matrix[i][j] = num;
          rem = 0;
        }
      }
    }
    if(rem) {
      i = matrix.length - 1;
      if(matrix[i].length < BN.CHUNK_SIZE) {
        matrix[i].push(rem);
      } else {
        matrix.push([rem]);
      }
    }
    return matrix;
  };

  BN.sumMatrix = function(mm0, mm1) {
    var matrix = []
      , chunk = []
      , strNum = ''
      , rem = 0
      , chunkId = 0
      , itemId = 0
      , n
      , tmp
      , v0
      , v1
      , d0 = BN.getDigitsLength(mm0)
      , d1 = BN.getDigitsLength(mm1)
      , m0
      , m1;

    if(d0 > d1) {
      m0 = mm1;
      m1 = mm0;
    } else {
      m0 = mm0;
      m1 = mm1;
    }

    while(chunkId !== null) {
      // get the numbers
      v0 = (m0[chunkId] !== undefined)? m0[chunkId][itemId] || 0 : 0;
      v1 = (m1[chunkId] !== undefined)? m1[chunkId][itemId] : undefined;
      if(v1 === undefined) {
        chunkId = null;
        matrix.push(chunk);
        if(rem) {
          var l = matrix.length - 1;
          if(matrix[l].length < BN.CHUNK_SIZE) {
            matrix[l].push(rem);
          } else {
            matrix.push([rem]);
          }
          strNum = rem + strNum;
        }
        break;
      }

      // make the sum
      n = v0 + v1 + rem;
      // set the remainder
      if(n >= 10) {
        tmp = n.toString().split('');
        rem = BN.to_i(tmp[0]);
        n = BN.to_i(tmp[1]);
      } else {
        rem = 0;
      }

      // save the value
      if(chunk.length < BN.CHUNK_SIZE) {
        chunk.push(n);
      } else {
        matrix.push(chunk);
        chunk = [n];
      }
      strNum = n + strNum;

      // increase the iterators
      itemId++;
      if(itemId >= BN.CHUNK_SIZE) {
        itemId = 0;
        chunkId++;
      }
    }

    // Handle ZER0
    if(/[^0]/.test(strNum)) {
      return {strNum: strNum, matrix: matrix};
    } else {
      return {strNum: '0', matrix: [[0]]};
    }
  };


  BN.prototype.equal = function(n) {
    n = BN.getStrValue(n);
    return n === this.strNum;
  };

  BN.prototype.greaterThan = function(n) {
    n = BN.getStrValue(n);
    if(n === this.strNum) return false;
    return BN._maxStr(this.strNum, n) === this.strNum;
  }

  BN.prototype.greaterThanEqual = function(n) {
    n = BN.getStrValue(n);
    if(n === this.strNum) return true;
    return BN._maxStr(this.strNum, n) === this.strNum;
  }

  BN.prototype.lessThan = function(n) {
    n = BN.getStrValue(n);
    if(n === this.strNum) return false;
    return BN._maxStr(this.strNum, n) === n;
  }

  BN.prototype.lessThanEqual = function(n) {
    n = BN.getStrValue(n);
    if(n === this.strNum) return true;
    return BN._maxStr(this.strNum, n) === n;
  }



  BN.prototype.sum = function(n, callback) {
    n = BN.getStrValue(n);
    var result = BN.sumMatrix(this.matrix, BN.strToMatrix(n));
    this.strNum = result.strNum;
    this.matrix = result.matrix;

    if(callback) return callback(this.strNum);
    return this;
  };

  BN.prototype.multiply = function(n, callback) {
    n = BN.getStrValue(n);
    if(n.length > 1) {
      n = n.split('').reverse();

      var base = BN.multiplyMatrix(this.matrix.slice(), BN.to_i(n[0]))
        , next
        , sum
        , strNum;

      for(var i=1, l=n.length; i<l; i++) {
        next = BN.multiplyMatrix(BN.strToMatrix(this.strNum + BN.get_z(i)),  BN.to_i(n[i]));
        sum = BN.sumMatrix(base, next);
        base = sum.matrix;
        strNum = sum.strNum;
      }

      this.matrix = base;
      this.strNum = strNum;

      if(callback) return callback(this.strNum);
      return this;
    } else {
      this.matrix = BN.multiplyMatrix(this.matrix, BN.to_i(n));
      this.strNum = BN.matrixToStr(this.matrix);

      if(callback) return callback(this.strNum);
      return this;
    }
  };
