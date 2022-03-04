// For more info check the gitlab repostitory READMEs and wiki page.
import express from 'express';
import commandRoutes from './command';
import operationRoutes from './operation';
// import ccpingRoutes from './cluster_core_ping';

const router = express.Router();

// "home page" functions
router.get('/', (req, res) => {
  try {
    res.json({
      message: 'Welcome to resop API. I am ready to work!',
      user: req.user,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});
// import other routes
router.use(commandRoutes);
router.use(operationRoutes);
// router.use('/ccping', ccpingRoutes);

export default router;
