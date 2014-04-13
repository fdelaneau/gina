var inherits = require('../inherits');

var A = function() {
    var _this = this;
    this.name = 'Julia Roberts';
    this.getName = function () {
        return _this.name;
    };
};

var B = function(gender) {//Super Class
    var _this = this;
    this.gender = gender;
    this.name = 'Michael Jackson';
    this.age = 46;

    this.getAge = function () {
        return _this.age;
    };

    this.getGender = function() {
        return this.gender
    }
};

var a = new ( inherits(A, B) )('male');

exports['Object created'] = function(test) {
    test.equal( typeof(a), 'object' );
    test.done()
}

exports['Has both instances'] = function(test) {
    test.equal(a instanceof A, true);
    test.equal(a instanceof B, true);
    test.done()
}

exports['Super overrides'] = function(test) {
    test.equal(a.name, 'Michael Jackson');
    test.equal(a.getName(), 'Michael Jackson');
    test.done()
}

exports['Can access both properties'] = function(test) {
    test.equal(a.getName(), 'Michael Jackson');
    test.equal(a.getAge(), 46);
    test.done()
}

exports['Got arguments'] = function(test) {
    test.equal(a.gender, 'male');
    test.done()
}
