import { useEffect, useState } from "react";
import styled from "styled-components";

function App() {
  const arr = [];
  for (let i = 1; i <= 2000; i++) {
    arr.push({
      id: i,
      val: i * 10,
    });
  }

  const [arr2, setArr] = useState([]);

  useEffect(() => {
    Promise.resolve()
      .then(() => {
        return new Promise((res) => {
          setTimeout(() => {
            let initStartTime = performance.now();
            // $("t-one").arr = arr;
            setArr(arr);
            console.log("init data time: ", performance.now() - initStartTime);
            setTimeout(() => {
              document.querySelector("#init-time").innerHTML =
                performance.now() - initStartTime;
              res();
            });
          }, 100);
        });
      })
      .then(() => {
        return new Promise((res) => {
          setTimeout(() => {
            const arr2 = arr.slice();
            arr2[2].val = "change val";

            const resetStartTime = performance.now();
            // $("t-one").arr = arr2;
            setArr(arr2);
            console.log(
              "reset data time: ",
              performance.now() - resetStartTime
            );
            setTimeout(() => {
              document.querySelector("#reset-item-time").innerHTML =
                performance.now() - resetStartTime;
              res();
            });
          }, 100);
        });
      })
      .then(() => {
        return new Promise((res) => {
          setTimeout(() => {
            const arr2 = arr.slice();
            arr2.splice(2, 0, { id: 2000000, val: "200000+" });

            const resetStartTime = performance.now();
            // $("t-one").arr = arr2;
            setArr(arr2);
            console.log(
              "reset data time: ",
              performance.now() - resetStartTime
            );
            setTimeout(() => {
              document.querySelector("#splice1-time").innerHTML =
                performance.now() - resetStartTime;
              res();
            });
          }, 1000);
        });
      })
      .then(() => {
        return new Promise((res) => {
          setTimeout(() => {
            const arr2 = arr.slice();
            arr2.splice(2, 1);

            const resetStartTime = performance.now();
            // $("t-one").arr = arr2;
            setArr(arr2);
            console.log(
              "reset data time: ",
              performance.now() - resetStartTime
            );
            setTimeout(() => {
              document.querySelector("#splice2-time").innerHTML =
                performance.now() - resetStartTime;
              res();
            });
          }, 1000);
        });
      })
      .then(() => {
        return new Promise((res) => {
          setTimeout(() => {
            const arr2 = arr.slice();
            arr2.reverse();

            const resetStartTime = performance.now();
            // $("t-one").arr = arr2;
            setArr(arr2);
            console.log(
              "reset data time: ",
              performance.now() - resetStartTime
            );
            setTimeout(() => {
              document.querySelector("#reset-time").innerHTML =
                performance.now() - resetStartTime;
              res();
            });
          }, 1000);
        });
      });
  }, []);

  return (
    <div>
      <TOne arr={arr2}></TOne>
    </div>
  );
}

function TOne({ arr }) {
  return (
    <Con1>
      {arr.map((e) => {
        return <TTwo val={e.val} key={e.id}></TTwo>;
      })}
    </Con1>
  );
}

const Con1 = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`;

function TTwo({ val }) {
  return (
    <Con2>
      <div className="con">{val}</div>
    </Con2>
  );
}

const Con2 = styled.div`
  .con {
    border: red solid 0.8px;
    display: inline-block;
    padding: 6px;
    margin: 2px;
    border-radius: 5px;
    animation: aaa ease 2s;
  }
  @keyframes aaa {
    0% {
      opacity: 0;
      background-color: red;
    }
    100% {
      opacity: 1;
      background-color: transparent;
    }
  }
`;

export default App;
