const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const stripe = require('stripe')("sk_test_51NIZ4aSCt6nI8QZIi2W4yibUA5DV3HnuiwQfyjn1gGm5plipsrajYTXp1IQmn71CsfJzB7Vy4e3i61qwz2TfVDsH00L8wckMat");

router.post("/create", async (req, res) => {
  try {
    const id = Date.now();
    const data = {
      productId: id,
      product_name: req.body.product_name,
      product_category: req.body.product_category,
      product_price: req.body.product_price,
      imageURL: req.body.imageURL,
    };

    const response = await db.
    collection("products").
    doc(`/${id}/`).set(data);
    console.log(response);
    return res.status(200).
    send({ success: true, data: response });

  } catch (err) {
    return res.send({ success: false, msg: `error :${err}` });
  }
});

//get all the products
router.get("/all", async (req, res) => {
  (async () => {
    try {
      let query = db.
      collection("products");
      let response = [];
      await query.get().then((querysnap) => {
        let docs = querysnap.docs;
        docs.map((doc) => {
          response.push({ ...doc.data() });
        });
        return response;
      });
      return res.status(200).send({ success: true, data: response });
    } catch (err) {
      return res.send({ success: false, msg: `error :${err}` });
    }
  })();
});
//delete a product
router.delete("/delete/:productId", async (req, res) => {
  const productId = req.params.productId;
  try {
await db.collection("products").doc(`/${productId}/`).delete().then(result => {
  return res.status(200).send({ success: true, data: result });

});
  } catch (err) {
    return res.send({ success: false, msg: `error :${err}` });

  }
});


//create a cart
router.post("/addToCart/:userId", async (req, res) => {
  const userId = req.params.userId;
  const productId = req.body.productId;

  try {
    const doc = await db
    .collection("cartItems")
    .doc(`/${userId}/`)
    .collection("items")
    .doc(`/${productId}/`)
    .get();

   if (doc.data()) {
    const quantity = doc.data().quantity + 1;
    const updatedItem = await db
    .collection("cartItems")
    .doc(`/${userId}/`)
    .collection("items")
    .doc(`/${productId}/`)
    .update({ quantity });
    return res.status(200).send({ success: true, data: updatedItem });
   } else {
    const data = {
      productId: productId,
      product_name: req.body.product_name,
      product_category: req.body.product_category,
      product_price: req.body.product_price,
      imageURL: req.body.imageURL,
      quantity: 1,
    };
    const addItems = await db
    .collection("cartItems")
    .doc(`/${userId}/`)
    .collection("items")
    .doc(`/${productId}/`)
    .set(data);
    return res.status(200).send({ success: true, data: addItems });
   }

  } catch (err) {
    return res.send({ success: false, msg: `error :${err}` });
  }
});

//update cart to increase and decrease the quantity
router.post("/updateCart/:user_id", async (req, res) => {
  const userId = req.params.user_id;
  const productId = req.query.productId;
  const type = req.query.type;

  try {
    const doc = await db.collection("cartItems").doc(`/${userId}/`).collection("items").doc(`/${productId}/`).get();

    if(doc.data()) {
      if(type === "increment"){
        const quantity = doc.data().quantity + 1;
        const updatedItem = await db.collection("cartItems").doc(`/${userId}/`).collection("items").doc(`/${productId}/`).update({ quantity });
        return res.status(200).send({ success: true, data: updatedItem });
      } else {
      if(doc.data().quantity === 1) {
        await db.collection("cartItems").doc(`/${userId}/`).collection("items").doc(`/${productId}/`).delete().then((result) => {
          return res.status(200).send({ success: true, data: result });
        });
      } else {
        const quantity = doc.data().quantity - 1;
        const updatedItem = await db.collection("cartItems").doc(`/${userId}/`).collection("items").doc(`/${productId}/`).update({ quantity });
        return res.status(200).send({ success: true, data: updatedItem });
     
      }
      }
    }
  } catch (err) {
    return res.send({ success: false, msg: `error :${err}` });

  }
});
//get all the cartitems for that user
router.get("/getCartItems/:user_id", async (req, res) => {
  const userId = req.params.user_id;
  (async () => {
    try {
      let query = db
      .collection("cartItems")
      .doc(`/${userId}/`)
      .collection("items");
      let response = [];

      await query.get().then((querysnap) => {
        let docs = querysnap.docs;

        docs.map((doc) => {
          response.push({ ...doc.data() });
        });
        return response;
      });
      return res.status(200).send({ success: true, data: response });
    } catch (err) {
      return res.send({ success: false, msg: `error :,${err}`});
    }
  })();
});


//stripe payment code

router.post("/create-checkout-success", async (req, res) => {

  const customer = await stripe.customers.create({
    metadata : {
      user_id: req.body.data.user.user_id,
      cart: JSON.stringify(req.body.data.cart),
      total: req.body.data.total,
    }
  })

  const line_items = req.body.data.cart.map(item => {
    return {
      price_data: {
        currency: "INR",
        product_data: {
          name: item.product_name,
          images: [item.imageURL],
          metadata: {
            id: item.productId
          }
        },
        unit_amount: item.product_price * 100,
      },
      quantity: item.quantity,
    }
  });

  try {
    const session = await stripe.checkout.sessions.create({ // Corrected the function name
      payment_method_types: ["card"], // Corrected the parameter name
      shipping_address_collection: { allowed_countries: ["IN"] }, // Corrected the parameter name
      shipping_options: [ // Corrected the parameter name
        {
           shipping_rate_data: {
                         type: "fixed_amount",
                         fixed_amount: { amount: 0, currency: "INR" },
                         display_name: "Free shipping", // Replace with the appropriate shipping rate ID
          delivery_estimate: {
            minimum: { unit: "hour", value: 2 },
            maximum: { unit: "hour", value: 4 },
          },
        },
        },
      ],
      phone_number_collection: {
        enabled: true, // Corrected the parameter name
      },
      line_items,
      customer : customer.id,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/checkout-success`,
      cancel_url: `${process.env.CLIENT_URL}/`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'An error occurred while creating the checkout session.' });
  }
});


const endpointSecret = "whsec_c88a63846515a544de1654de990ab486d3664610be8e65a5b3acf6e509b6c3fc";

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sigHeader = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sigHeader, endpointSecret);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const customer = await stripe.customers.retrieve(session.customer);
      await createOrder(customer, session, res);
    }

    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
// create a order
const createOrder = async (customer, intent, res) => {
  try {
    const orderId = Date.now();
    const data = {
      intentId: intent.id,
      orderId: orderId,
      amount: intent.amount_total,
      created: intent.created,
      payment_method_types: intent.payment_method_types,
      status: intent.payment_status,
      customer: intent.customer_details,
      shipping_details: intent.shipping_details,
      userId: customer.metadata.user_id,
      items: JSON.parse(customer.metadata.cart),
      total: customer.metadata.total,
      sts: "preparing",
    };

    // Add the order to the "orders" collection
    await db.collection("orders").doc(`/${orderId}/`).set(data);

    // Delete cart items for the user
    await deleteCart(customer.metadata.user_id, JSON.parse(customer.metadata.cart));

    return res.status(200).send({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ success: false, msg: `Error creating order: ${err}` });
  }
};


//delete a cartitems
const deleteCart = async (userId, items) => {
  try {
    for (const item of items) {
      await db
        .collection("cartItems")
        .doc(`/${userId}/`)
        .collection("items")
        .doc(`/${item.productId}/`)
        .delete();
    }
  } catch (err) {
    console.log(err);
    throw new Error(`Error deleting cart items: ${err}`);
  }
};

//orders fetching
router.get("/orders", async (req, res) => {
  (async () => {
    try {
      let query = db.
      collection("orders");
      let response = [];
      await query.get().then((querysnap) => {
        let docs = querysnap.docs;
        docs.map((doc) => {
          response.push({ ...doc.data() });
        });
        return response;
      });
      return res.status(200).send({ success: true, data: response });
    } catch (err) {
      return res.send({ success: false, msg: `error :${err}` });
    }
  })();
});

module.exports = router;  

































