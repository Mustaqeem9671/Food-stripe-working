import React, { useEffect, useState } from 'react';
import {Header} from '../components';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrder } from '../api';
import { setOrders } from '../context/actions/orderAction';
import { OrderData } from "../components";

const UsersOrder = () => {

  const user = useSelector((state) => state.user);
  const orders = useSelector((state) => state.orders);
  const dispatch = useDispatch();

  const [userOrders, setUserOrders] = useState(null);

  useEffect(() => {
   if (!orders) {
    getAllOrder().then((data) => {
        dispatch(setOrders(data));
        setUserOrders(data.filter((item) => item.userId === user?.user_id));
    });
   } else {
    setUserOrders(orders.filter((data) => data.userId === user?.user_id));
   }

  
  }, [orders]);

  return (
    <main className='w-screen min-h-screen flex flex-col bg-primary'>
      <Header />
      <div className='w-full flex flex-col items-start justify-center mt-40 px-6 md:px-24 2xl:px-96'  >
     {userOrders?.length > 0 ? (
       userOrders.map((item, i) => (
        <OrderData key={i} data={item} admin={false} />
    ))
     ) : (
        <><h1 className="text-[72px] text-headingColor font-bold" >No Data</h1></>
     ) }
      </div>
    </main>
  );
};

export default UsersOrder;