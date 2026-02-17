const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);

admin.initializeApp();
const db = admin.firestore();

exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  // 1. Authenticate the user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const planId = data.planId;

  if (!planId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a planId."
    );
  }

  // 2. Retrieve the plan details from your (Firestore) database or a local config
  // For now, using a simplified hardcoded approach. In a real app, retrieve from Firestore.
  const plans = {
    pro: { name: "Pro Plan", price: 4900, interval: "month" }, // Price in cents
    enterprise: { name: "Enterprise Plan", price: 19900, interval: "month" },
  };

  const selectedPlan = plans[planId];

  if (!selectedPlan) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid planId provided."
    );
  }

  // 3. Get or Create a Stripe Customer
  const userDoc = await db.collection("users").doc(userId).get();
  const userData = userDoc.data();

  let customerId;
  if (userData && userData.stripeCustomerId) {
    customerId = userData.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: context.auth.token.email,
      metadata: { firebaseUid: userId },
    });
    customerId = customer.id;
    await db.collection("users").doc(userId).update({ stripeCustomerId: customerId });
  }

  // 4. Create a Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency || "usd", // Assuming USD, but can be dynamic
            product_data: {
              name: selectedPlan.name,
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: selectedPlan.interval },
          },
          quantity: 1,
        },
      ],
      success_url: `https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://your-app.com/cancel`,
      metadata: { firebaseUid: userId, planId: planId },
    });
    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to create checkout session.",
      error.message
    );
  }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ]);

  let event;

  // Verify Stripe webhook signature
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.rawBody, sig, functions.config().stripe.webhook_secret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (relevantEvents.has(event.type)) {
    try {
      const customer = event.data.object;
      const firebaseUid = customer.metadata.firebaseUid;

      if (!firebaseUid) {
        throw new Error('Firebase UID not found in Stripe customer metadata.');
      }

      switch (event.type) {
        case 'checkout.session.completed':
          // For one-time payments, you might update the user's access here.
          // For subscriptions, this event usually means the subscription is starting.
          // The subscription object can be found in `customer.subscription` if it's a subscription checkout.
          const checkoutSession = event.data.object;
          const subscriptionId = checkoutSession.subscription;

          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await db.collection('users').doc(firebaseUid).update({
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer,
              subscriptionPlan: checkoutSession.metadata.planId, // Assuming planId is passed in metadata
              subscriptionStatus: subscription.status,
              subscriptionEndDate: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
            });
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          await db.collection('users').doc(firebaseUid).update({
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            subscriptionPlan: subscription.metadata.planId, // Assuming planId is passed in metadata
            subscriptionStatus: subscription.status,
            subscriptionEndDate: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          });
          break;

        default:
          console.warn(`Unhandled event type ${event.type}`);
      }
      return res.status(200).send('Webhook received and processed.');
    } catch (error) {
      console.error("Error processing Stripe webhook event:", error);
      return res.status(500).send('Error processing webhook.');
    }
  }

  return res.status(200).send('Event not handled.');
});