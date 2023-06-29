import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrder } from '../api';
import { setOrders } from '../context/actions/orderAction';
<<<<<<< HEAD
=======
import { OrderData } from '../components';
>>>>>>> 59db177d9b35eb58ce11e2cb9e99c88ddac569ba

const DBOrders = () => {
  const orders = useSelector((state) => state.orders);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (!orders) {
      getAllOrder().then((data) => {
<<<<<<< HEAD
        console.log(data)
=======
>>>>>>> 59db177d9b35eb58ce11e2cb9e99c88ddac569ba
        dispatch(setOrders(data));
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center flex-col pt-6 w-full gap-4" >
      {orders ? (
<<<<<<< HEAD
      <>{orders.toString()}</>
=======
      <> {orders.map((item, i) => (
        <OrderData key={i} index={i} data={item} admin={true} />
      ))}
      </>
>>>>>>> 59db177d9b35eb58ce11e2cb9e99c88ddac569ba
      ) : (
      <>
      <h1 className="text-[72px] text-headingColor font-bold" >No Data</h1>
      </>
      )}
      </div>
  )
};

export default DBOrders;