import React from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Form, Button, Spinner } from "react-bootstrap";
import { FaEnvelope, FaUser, FaCommentDots, FaRegPaperPlane, FaHandsHelping, FaHeadset, FaShieldAlt, FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useDispatch, useSelector } from "react-redux";
import { createContact, selectContactSubmitting, selectContactSubmitError, selectContactLastSubmitted } from "../Features/Backend/ContactSlice";

function ContactUs() {
  const dispatch = useDispatch();
  const submitting = useSelector(selectContactSubmitting);
  const submitError = useSelector(selectContactSubmitError);
  const lastSubmitted = useSelector(selectContactLastSubmitted);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");

  const onSubmit = async (data) => {
    const result = await dispatch(createContact(data));
    if (createContact.fulfilled.match(result)) {
      setToastMsg("Your message has been sent!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
      reset();
    } else {
      setToastMsg(result.payload || "Unable to send message.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  return (
    <>
      <Navbar />
      <motion.div className="contact-us-bg-fix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.75 }}>
        <style>{`
          .contact-us-bg-fix {
            min-height: 100vh;
            width: 100%;
            box-sizing: border-box;
            background: linear-gradient(135deg, #111827 0%, #1e293b 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            overflow-x: hidden;
            padding-top: 0 !important;
            margin-top: 0 !important;
            padding-bottom: 60px;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          .contact-content-flex {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            gap: 40px;
            max-width: 1100px;
            width: 100%;
            padding: 0 1.5rem;
            position: relative;
            box-sizing: border-box;
          }
          .glass-section {
            background: rgba(30, 41, 59, 0.7);
            border-radius: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(16px);
            padding: 3.5rem;
            display: flex;
            flex-direction: row;
            gap: 50px;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .contact-guide-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .guide-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
            background: linear-gradient(to right, #60a5fa, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .guide-about {
            font-size: 1rem;
            color: #94a3b8;
            line-height: 1.7;
          }
          .guide-benefits {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin: 12px 0;
          }
          .benefit-item {
            font-size: 0.95rem;
            font-weight: 500;
            color: #e2e8f0;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: transform 0.2s;
          }
          .benefit-item:hover {
            transform: translateX(8px);
            background: rgba(255, 255, 255, 0.08);
          }
          .social-row {
            display: flex;
            gap: 1.5rem;
            margin-top: 10px;
          }
          .social-row a {
            color: #64748b;
            font-size: 1.6rem;
            transition: all 0.3s;
          }
          .social-row a:hover {
            color: #60a5fa;
            transform: translateY(-4px);
          }
          .guide-support {
            font-size: 1rem;
            color: #cbd5e1;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 4px 0;
          }
          .glass-form-section {
            flex: 1.2;
            display: flex;
            flex-direction: column;
          }
          .contact-title {
            font-size: 2rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 12px;
            letter-spacing: -0.02em;
          }
          .contact-subtext {
            font-size: 1rem;
            color: #94a3b8;
            margin-bottom: 32px;
          }
          .contact-form .form-group {
            margin-bottom: 1.5rem;
          }
          .contact-form .form-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .icon-circle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: rgba(96, 165, 250, 0.15);
            border-radius: 8px;
            color: #60a5fa;
            font-size: 0.85rem;
          }
          .contact-form .form-control {
            background: rgba(15, 23, 42, 0.5) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            color: #ffffff !important;
            font-size: 1rem !important;
            transition: all 0.3s !important;
          }
          .contact-form .form-control:focus {
            background: rgba(15, 23, 42, 0.8) !important;
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.15) !important;
          }
          .contact-form .form-control::placeholder {
            color: #475569 !important;
          }
          .fullscreen-btn {
            width: auto;
            min-width: 200px;
            margin: 10px auto 0 auto;
            display: flex;
            justify-content: center;
            background: linear-gradient(135deg, #f97316 0%, #facc15 100%);
            color: #1e293b;
            font-weight: 700;
            border-radius: 12px;
            border: none;
            padding: 12px 24px;
            font-size: 0.95rem;
            transition: all 0.3s;
            box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
            cursor: pointer;
          }
          .fullscreen-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
            filter: brightness(1.1);
          }
          .contact-toast {
            position: fixed;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: #ffffff;
            border: 1px solid #3b82f6;
            border-radius: 16px;
            padding: 16px 32px;
            z-index: 10000;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          }
          @media (max-width: 1024px) {
            .glass-section { padding: 2.5rem; gap: 32px; }
          }
          @media (max-width: 850px) {
            .contact-us-bg-fix { padding-top: 0 !important; padding-bottom: 40px; }
            .glass-section { flex-direction: column; padding: 2rem; }
            .guide-title, .contact-title { text-align: center; }
            .guide-about, .contact-subtext { text-align: center; }
            .guide-benefits, .social-row, .guide-support { align-items: center; justify-content: center; }
            .benefit-item { width: 100%; max-width: 400px; margin: 0 auto; }
            .contact-content-flex { padding: 0 1rem; }
            .social-row { justify-content: center; }
          }
          @media (max-width: 480px) {
            .contact-title, .guide-title { font-size: 1.4rem; text-align: center; }
            .guide-about, .contact-subtext { font-size: 0.85rem; text-align: center; }
            .glass-section { border-radius: 20px; padding: 1.5rem; }
          }
        `}</style>
        <div className="contact-content-flex">
          <motion.div className="glass-section" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .7, delay: .10 }}>
            <div className="contact-guide-section">
              <div className="guide-title"><FaHandsHelping style={{marginBottom:"-6px",color:'#faf891'}}/> About Our Marketplace</div>
              <div className="guide-about">
                Welcome to <span style={{color:'#00eaff'}}>MyShop</span> — a trusted multivendor eCommerce platform for buyers and sellers. Find the best deals, verified sellers, and secure shopping. Fast delivery, easy returns, and 24/7 chat support.
              </div>
              <div className="guide-benefits">
                <div className="benefit-item"><FaShieldAlt color="#14fae4"/> Secure Payment Protection</div>
                <div className="benefit-item"><FaHeadset color="#ffd871" /> 24/7 Friendly Customer Support</div>
                <div className="benefit-item"><FaCommentDots color="#6ceaff"/> Live Chat & Seller Q/A</div>
              </div>
              <div className="guide-support"><FaEnvelope style={{marginRight:3}}/> contact@myshop.com</div>
              <div className="guide-support"><FaHeadset style={{marginRight:8}}/> Hotline: <b>+92-304-1234567</b></div>
              <div className="social-row">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              </div>
            </div>
            <div className="glass-form-section">
              <div className="contact-title"><FaEnvelope style={{marginBottom:"-6px"}} /> Contact Us</div>
              <div className="contact-subtext">
                Any queries or feedback? We respond within 24 hours!
              </div>
              <Form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                <Form.Group className="mb-3">
                  <Form.Label><span className="icon-circle"><FaUser color="#18e4fb" /></span>Name</Form.Label>
                  <Form.Control type="text" {...register("name", { required: "Name is required", minLength: { value: 2, message: "Minimum 2 characters" } })} placeholder="Your Name" isInvalid={!!errors.name} autoFocus />
                  {errors.name && <span className="err-message">{errors.name.message}</span>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label><span className="icon-circle"><FaEnvelope color="#18e4fb" /></span>Email</Form.Label>
                  <Form.Control type="email" {...register("email", { required: "Email is required", pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Enter valid email" } })} placeholder="you@email.com" isInvalid={!!errors.email} />
                  {errors.email && <span className="err-message">{errors.email.message}</span>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label><span className="icon-circle"><FaCommentDots color="#18e4fb" /></span>Subject</Form.Label>
                  <Form.Control type="text" {...register("subject", { required: "Subject is required", minLength: { value: 3, message: "Min 3 letters"} })} placeholder="What is this about?" isInvalid={!!errors.subject}/>
                  {errors.subject && <span className="err-message">{errors.subject.message}</span>}
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label><span className="icon-circle"><FaCommentDots color="#18e4fb" /></span>Message</Form.Label>
                  <Form.Control as="textarea" rows={4} {...register("message", { required: "Message is required", minLength: { value: 10, message: "Minimum 10 characters" } })} placeholder="Type your message..." isInvalid={!!errors.message} />
                  {errors.message && <span className="err-message">{errors.message.message}</span>}
                </Form.Group>
                <motion.div whileHover={{ scale: 1.045 }}>
                  <Button className="fullscreen-btn" type="submit" disabled={isSubmitting || submitting}>
                    {(isSubmitting || submitting) ? <Spinner animation="border" size="sm"/> : <span><FaRegPaperPlane style={{marginRight:7}}/> Send Message</span>}
                  </Button>
                </motion.div>
                {submitError && <div style={{color:"#ff9b9b", marginTop:"8px"}}>{submitError}</div>}
                {lastSubmitted && !submitError && (
                  <div style={{color:"#9efbb6", marginTop:"8px"}}>Saved successfully.</div>
                )}
              </Form>
            </div>
          </motion.div>
        </div>
        <AnimatePresence>{showToast && (
          <motion.div className="contact-toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>{toastMsg}</motion.div>
        )}</AnimatePresence>
      </motion.div>
      <Footer />
    </>
  );
}

export default ContactUs;
