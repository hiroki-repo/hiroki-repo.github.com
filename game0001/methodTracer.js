// Generated by CoffeeScript 1.9.0
(function() {
  var __slice = [].slice;

  this.MethodTracer = (function() {
    function MethodTracer() {
      this.tracer = {};
    }

    MethodTracer.prototype.trace = function(clasname) {
      var clas, f, name, tracer, uniqueId, _ref;
      clas = eval(clasname);
      _ref = clas.prototype;
      for (name in _ref) {
        f = _ref[name];
        if (!(typeof f === 'function')) {
          continue;
        }
        uniqueId = clasname + "#" + name;
        tracer = this.tracer;
        tracer[uniqueId] = false;
        clas.prototype[name] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          tracer[uniqueId] = true;
          return f.apply(null, args);
        };
      }
      return this;
    };

    MethodTracer.prototype.traceClasses = function(classNames) {
      var clas, _i, _len, _ref;
      _ref = classNames.split(' ');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        clas = _ref[_i];
        this.trace(clas);
      }
      return this;
    };

    MethodTracer.prototype.traceModule = function(module, moduleName) {
      var f, name, tracer, uniqueId;
      for (name in module) {
        f = module[name];
        if (!(typeof f === 'function')) {
          continue;
        }
        uniqueId = "Module " + moduleName + "#" + name;
        tracer = this.tracer;
        tracer[uniqueId] = false;
        module[name] = this.wrapfn(module, uniqueId, f);
      }
      return this;
    };

    MethodTracer.prototype.wrapfn = function(module, uniqueId, f) {
      var self;
      self = this;
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        self.tracer[uniqueId] = true;
        return f.apply(module, args);
      };
    };

    MethodTracer.prototype.printUnused = function() {
      var id, used, _ref;
      _ref = this.tracer;
      for (id in _ref) {
        used = _ref[id];
        if (!used) {
          puts(id);
        }
      }
      return this;
    };

    return MethodTracer;

  })();

}).call(this);

//# sourceMappingURL=methodTracer.js.map
