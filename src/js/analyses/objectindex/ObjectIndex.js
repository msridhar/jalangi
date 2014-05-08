/*
 * Copyright 2013-2014 Samsung Information Systems America, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Koushik Sen

(function (sandbox) {

    function ExecutionIndex() {
        var counters = {};
        var countersStack = [counters];

        function executionIndexCall() {
            counters = {};
            countersStack.push(counters);
        }

        function executionIndexReturn() {
            countersStack.pop();
            counters = countersStack[countersStack.length - 1];
        }

        function executionIndexInc(iid) {
            var c = counters[iid];
            if (c === undefined) {
                c = 1;
            } else {
                c++;
            }
            counters[iid] = c;
            counters.iid = iid;
            counters.count = c;
        }

        function executionIndexGetIndex() {
            var i, ret = [];
            var iid;
            for (i = 0; i < countersStack.length; i++) {
                iid = countersStack[i].iid;
                if (iid !== undefined) {
                    ret.push({iid:iid,count:countersStack[i].count});
                }
            }
            return ret;
        }

        if (this instanceof ExecutionIndex) {
            this.executionIndexCall = executionIndexCall;
            this.executionIndexReturn = executionIndexReturn;
            this.executionIndexInc = executionIndexInc;
            this.executionIndexGetIndex = executionIndexGetIndex;
        } else {
            return new ExecutionIndex();
        }
    }


    function ObjectIndex() {

        var smemory = sandbox.smemory;
        var iidToLocation = sandbox.iidToLocation;
        var Constants = sandbox.Constants;
        var Config = sandbox.Config;
        var HOP = Constants.HOP;
        var executionIndex = new ExecutionIndex();

        var info = {};

        function printInfo(info, tab) {
            for (var iid in info) {
                if (HOP(info, iid) && iid !== 'count') {
                    console.log(tab+"#"+info[iid].count+":"+iidToLocation(iid));
                    printInfo(info[iid], tab+"    ");
                }
            }
        }

        function addCount(index, i) {
            var tmp = info;
            for (var j = index.length-1; j>=i; j--) {
                var iid = index[j].iid;
                if(!tmp[iid]) {
                    tmp[iid] = {count:0};
                }
                tmp = tmp[iid];
            }
            tmp.count++;
        }

        function subtractCount(index, i) {
            var tmp = info;
            for (var j = index.length-1; j>=i; j--) {
                var iid = index[j].iid;
                if(!tmp[iid]) {
                    tmp[iid] = {count:0};
                }
                tmp = tmp[iid];
            }
            tmp.count--;
        }

        function indexOfDeviation(creationIndex, accessIndex) {
            var i, len = creationIndex.length;
            for (i=0; i<len;i++) {
                if (creationIndex[i].iid !== accessIndex[i].iid || creationIndex[i].count !== accessIndex[i].count) {
                    return i;
                }
            }
            return i;
        }


        function annotateObject(iid, obj) {
            var sobj = smemory.getShadowObject(obj);

            if (sobj) {
                executionIndex.executionIndexInc(iid);
                if (sobj.creationIndex === undefined) {
                    sobj.creationIndex = executionIndex.executionIndexGetIndex();
                    sobj.i = sobj.creationIndex.length-1;
                    addCount(sobj.creationIndex, sobj.i);
                }
            }
        }

        function accessObject(obj) {
            var sobj = smemory.getShadowObject(obj);

            if (sobj && sobj.creationIndex) {
                executionIndex.executionIndexInc(0);
                var accessIndex = executionIndex.executionIndexGetIndex();
                var newi = indexOfDeviation(sobj.creationIndex, accessIndex);
                if (newi < sobj.i) {
                    subtractCount(sobj.creationIndex, sobj.i);
                    addCount(sobj.creationIndex, newi);
                    sobj.i = newi;
                }
            }
        }


//        this.installAxiom = function (c) {};
//
//        this.makeConcolic = function (idx, val, getNextSymbol) {
//            return val;
//        };
//
//        this.makeConcolicPost = function () {};
//
//        this.declare = function (iid, name, val, isArgument) {};
//
//        this.literalPre = function (iid, val) {};
//
        this.literal = function (iid, val) {
            annotateObject(iid, val);
            return val;
        };
//
        this.invokeFunPre = function (iid, f, base, args, isConstructor) {
            executionIndex.executionIndexInc(iid);
        };
//
        this.invokeFun = function (iid, f, base, args, val, isConstructor) {
            if (isConstructor) {
                annotateObject(iid, val);
            }
            accessObject(f);
            return val;
        };
//
//        this.getFieldPre = function (iid, base, offset) {};
//
        this.getField = function (iid, base, offset, val) {
            accessObject(base);
            return val;
        };
//
//        this.putFieldPre = function (iid, base, offset, val) {
//            return val;
//        };
//
        this.putField = function (iid, base, offset, val) {
            accessObject(base);
            return val;
        };
//
//        this.readPre = function (iid, name, val, isGlobal) {};
//
//        this.read = function (iid, name, val, isGlobal) {
//            return val;
//        };
//
//        this.writePre = function (iid, name, val, oldValue) {};
//
//        this.write = function (iid, name, val, oldValue) {
//            return val;
//        };
//
//        this.binaryPre = function (iid, op, left, right) {};
//
//        this.binary = function (iid, op, left, right, result_c) {
//            return result_c;
//        };
//
//        this.unaryPre = function (iid, op, left) {};
//
//        this.unary = function (iid, op, left, result_c) {
//            return result_c;
//        };
//
//        this.conditionalPre = function (iid, left) {};
//
//        this.conditional = function (iid, left, result_c) {
//            return left;
//        };
//
//        this.beginExecution = function (data) {};
//
        this.endExecution = function () {
            printInfo(info, "");
//            console.log(JSON.stringify(info));
        };
//
        this.functionEnter = function (iid, fun, dis /* this */, args) {
            executionIndex.executionIndexCall();
        };
//
        this.functionExit = function (iid) {
            executionIndex.executionIndexReturn();
            return false;
            /* a return of false means that do not backtrack inside the function */
        };
//
//        this.return_ = function (val) {
//            return val;
//        };
//
        this.scriptEnter = function (iid, fileName) {
            executionIndex.executionIndexCall();
        };
//
        this.scriptExit = function (iid) {
            executionIndex.executionIndexReturn();
        };
//
//        this.instrumentCode = function(iid, code) {
//            return code;
//        };
    }

    sandbox.analysis = new ObjectIndex();
}(J$));
