// Discount and Coupon System for LMS

class DiscountManager {
  constructor() {
    this.discounts = this.loadDiscounts();
    this.coupons = this.loadCoupons();
    this.usageHistory = this.loadUsageHistory();
  }

  loadDiscounts() {
    const stored = localStorage.getItem('discounts');
    return stored ? JSON.parse(stored) : [];
  }

  loadCoupons() {
    const stored = localStorage.getItem('coupons');
    return stored ? JSON.parse(stored) : [];
  }

  loadUsageHistory() {
    const stored = localStorage.getItem('discount_usage_history');
    return stored ? JSON.parse(stored) : [];
  }

  saveDiscounts() {
    localStorage.setItem('discounts', JSON.stringify(this.discounts));
  }

  saveCoupons() {
    localStorage.setItem('coupons', JSON.stringify(this.coupons));
  }

  saveUsageHistory() {
    localStorage.setItem('discount_usage_history', JSON.stringify(this.usageHistory));
  }

  // Create a discount
  createDiscount(discountData) {
    const discount = {
      id: Date.now().toString(),
      name: discountData.name,
      description: discountData.description,
      type: discountData.type, // 'percentage' or 'fixed'
      value: parseFloat(discountData.value),
      applicableTo: discountData.applicableTo, // 'all', 'courses', 'bundles', 'subscriptions'
      applicableIds: discountData.applicableIds || [], // specific course/bundle IDs
      minPurchase: parseFloat(discountData.minPurchase) || 0,
      maxDiscount: discountData.maxDiscount ? parseFloat(discountData.maxDiscount) : null,
      usageLimit: parseInt(discountData.usageLimit) || null,
      usedCount: 0,
      startDate: discountData.startDate || new Date().toISOString(),
      endDate: discountData.endDate || null,
      isActive: discountData.isActive !== false,
      createdBy: this.getCurrentUser()?.id,
      createdAt: new Date().toISOString()
    };

    // Validate discount
    this.validateDiscount(discount);

    this.discounts.push(discount);
    this.saveDiscounts();

    return discount;
  }

  // Create a coupon code
  createCoupon(couponData) {
    const coupon = {
      id: Date.now().toString(),
      code: couponData.code.toUpperCase(),
      name: couponData.name,
      description: couponData.description,
      type: couponData.type, // 'percentage' or 'fixed'
      value: parseFloat(couponData.value),
      applicableTo: couponData.applicableTo, // 'all', 'courses', 'bundles', 'subscriptions'
      applicableIds: couponData.applicableIds || [],
      minPurchase: parseFloat(couponData.minPurchase) || 0,
      maxDiscount: couponData.maxDiscount ? parseFloat(couponData.maxDiscount) : null,
      usageLimit: parseInt(couponData.usageLimit) || null,
      perUserLimit: parseInt(couponData.perUserLimit) || 1,
      usedCount: 0,
      userUsage: {}, // track usage per user
      startDate: couponData.startDate || new Date().toISOString(),
      endDate: couponData.endDate || null,
      isActive: couponData.isActive !== false,
      createdBy: this.getCurrentUser()?.id,
      createdAt: new Date().toISOString()
    };

    // Validate coupon
    this.validateCoupon(coupon);

    // Check for duplicate codes
    if (this.coupons.some(c => c.code === coupon.code)) {
      throw new Error('Coupon code already exists');
    }

    this.coupons.push(coupon);
    this.saveCoupons();

    return coupon;
  }

  // Validate discount data
  validateDiscount(discount) {
    if (!discount.name || discount.name.trim().length < 3) {
      throw new Error('Discount name must be at least 3 characters');
    }

    if (!['percentage', 'fixed'].includes(discount.type)) {
      throw new Error('Discount type must be "percentage" or "fixed"');
    }

    if (discount.value <= 0) {
      throw new Error('Discount value must be greater than 0');
    }

    if (discount.type === 'percentage' && discount.value > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (discount.endDate && new Date(discount.endDate) <= new Date()) {
      throw new Error('End date must be in the future');
    }
  }

  // Validate coupon data
  validateCoupon(coupon) {
    if (!coupon.code || coupon.code.length < 3) {
      throw new Error('Coupon code must be at least 3 characters');
    }

    if (!/^[A-Z0-9]+$/.test(coupon.code)) {
      throw new Error('Coupon code can only contain letters and numbers');
    }

    // Same validation as discount
    this.validateDiscount(coupon);
  }

  // Apply discount/coupon to a purchase
  applyDiscount(purchaseData, discountCode = null) {
    const { items, userId } = purchaseData;
    let totalDiscount = 0;
    let appliedDiscounts = [];

    // Calculate original total
    const originalTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Apply coupon if provided
    if (discountCode) {
      const couponDiscount = this.applyCoupon(discountCode, items, userId, originalTotal);
      if (couponDiscount) {
        totalDiscount += couponDiscount.amount;
        appliedDiscounts.push(couponDiscount);
      }
    }

    // Apply automatic discounts
    const autoDiscounts = this.getApplicableDiscounts(items, userId, originalTotal - totalDiscount);
    autoDiscounts.forEach(discount => {
      const discountAmount = this.calculateDiscountAmount(discount, items, originalTotal);
      if (discountAmount > 0) {
        totalDiscount += discountAmount;
        appliedDiscounts.push({
          type: 'discount',
          id: discount.id,
          name: discount.name,
          amount: discountAmount
        });
      }
    });

    // Ensure total discount doesn't exceed original total
    totalDiscount = Math.min(totalDiscount, originalTotal);

    return {
      originalTotal,
      discountAmount: totalDiscount,
      finalTotal: originalTotal - totalDiscount,
      appliedDiscounts
    };
  }

  // Apply coupon code
  applyCoupon(code, items, userId, total) {
    const coupon = this.coupons.find(c => c.code === code.toUpperCase() && c.isActive);

    if (!coupon) {
      throw new Error('Invalid or inactive coupon code');
    }

    // Check date validity
    if (!this.isValidDateRange(coupon.startDate, coupon.endDate)) {
      throw new Error('Coupon is not valid for the current date');
    }

    // Check usage limits
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('Coupon usage limit exceeded');
    }

    if (coupon.perUserLimit && (coupon.userUsage[userId] || 0) >= coupon.perUserLimit) {
      throw new Error('You have already used this coupon the maximum number of times');
    }

    // Check minimum purchase
    if (total < coupon.minPurchase) {
      throw new Error(`Minimum purchase of $${coupon.minPurchase} required for this coupon`);
    }

    // Check applicability
    if (!this.isApplicableToItems(coupon, items)) {
      throw new Error('Coupon is not applicable to the selected items');
    }

    // Calculate discount amount
    const discountAmount = this.calculateDiscountAmount(coupon, items, total);

    // Apply usage limits
    coupon.usedCount++;
    coupon.userUsage[userId] = (coupon.userUsage[userId] || 0) + 1;
    this.saveCoupons();

    // Log usage
    this.logDiscountUsage({
      type: 'coupon',
      id: coupon.id,
      code: coupon.code,
      userId,
      amount: discountAmount,
      items: items.map(item => ({ id: item.id, type: item.type, price: item.price }))
    });

    return {
      type: 'coupon',
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      amount: discountAmount
    };
  }

  // Get applicable automatic discounts
  getApplicableDiscounts(items, userId, currentTotal) {
    return this.discounts.filter(discount => {
      if (!discount.isActive) return false;
      if (!this.isValidDateRange(discount.startDate, discount.endDate)) return false;
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return false;
      if (currentTotal < discount.minPurchase) return false;
      if (!this.isApplicableToItems(discount, items)) return false;

      return true;
    });
  }

  // Calculate discount amount for items
  calculateDiscountAmount(discount, items, total) {
    let discountAmount = 0;

    if (discount.applicableTo === 'all') {
      // Apply to entire order
      if (discount.type === 'percentage') {
        discountAmount = total * (discount.value / 100);
      } else {
        discountAmount = discount.value;
      }
    } else {
      // Apply only to applicable items
      const applicableItems = items.filter(item =>
        this.isItemApplicable(discount, item)
      );

      const applicableTotal = applicableItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      if (discount.type === 'percentage') {
        discountAmount = applicableTotal * (discount.value / 100);
      } else {
        discountAmount = Math.min(discount.value, applicableTotal);
      }
    }

    // Apply maximum discount limit
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  // Check if discount/coupon is applicable to items
  isApplicableToItems(discount, items) {
    if (discount.applicableTo === 'all') return true;

    return items.some(item => this.isItemApplicable(discount, item));
  }

  // Check if discount applies to specific item
  isItemApplicable(discount, item) {
    if (discount.applicableTo === 'all') return true;
    if (discount.applicableTo === item.type) return true;
    if (discount.applicableIds.includes(item.id)) return true;

    return false;
  }

  // Check date validity
  isValidDateRange(startDate, endDate) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  }

  // Get all active discounts and coupons
  getActiveDiscounts() {
    const now = new Date();
    return {
      discounts: this.discounts.filter(d => d.isActive && this.isValidDateRange(d.startDate, d.endDate)),
      coupons: this.coupons.filter(c => c.isActive && this.isValidDateRange(c.startDate, c.endDate))
    };
  }

  // Update discount/coupon
  updateDiscount(id, updates) {
    const discount = this.discounts.find(d => d.id === id);
    if (!discount) throw new Error('Discount not found');

    Object.assign(discount, updates, { updatedAt: new Date().toISOString() });
    this.validateDiscount(discount);
    this.saveDiscounts();

    return discount;
  }

  updateCoupon(id, updates) {
    const coupon = this.coupons.find(c => c.id === id);
    if (!coupon) throw new Error('Coupon not found');

    Object.assign(coupon, updates, { updatedAt: new Date().toISOString() });
    this.validateCoupon(coupon);
    this.saveCoupons();

    return coupon;
  }

  // Deactivate discount/coupon
  deactivateDiscount(id) {
    return this.updateDiscount(id, { isActive: false });
  }

  deactivateCoupon(id) {
    return this.updateCoupon(id, { isActive: false });
  }

  // Get discount/coupon statistics
  getDiscountStats() {
    const activeDiscounts = this.discounts.filter(d => d.isActive).length;
    const activeCoupons = this.coupons.filter(c => c.isActive).length;
    const totalUsage = this.usageHistory.length;
    const totalDiscountAmount = this.usageHistory.reduce((sum, usage) => sum + usage.amount, 0);

    return {
      activeDiscounts,
      activeCoupons,
      totalDiscounts: this.discounts.length,
      totalCoupons: this.coupons.length,
      totalUsage,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100
    };
  }

  // Log discount usage
  logDiscountUsage(usage) {
    const logEntry = {
      id: Date.now().toString(),
      ...usage,
      timestamp: new Date().toISOString()
    };

    this.usageHistory.push(logEntry);
    this.saveUsageHistory();
  }

  // Get usage history
  getUsageHistory(options = {}) {
    let history = [...this.usageHistory];

    // Filter by type
    if (options.type) {
      history = history.filter(h => h.type === options.type);
    }

    // Filter by user
    if (options.userId) {
      history = history.filter(h => h.userId === options.userId);
    }

    // Filter by date range
    if (options.since) {
      const sinceDate = new Date(options.since);
      history = history.filter(h => new Date(h.timestamp) >= sinceDate);
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return history;
  }

  // Generate coupon codes
  generateCouponCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Bulk create coupons
  bulkCreateCoupons(couponData, count) {
    const coupons = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateCouponCode();
      try {
        const coupon = this.createCoupon({
          ...couponData,
          code
        });
        coupons.push(coupon);
      } catch (error) {
        console.warn(`Failed to create coupon ${code}:`, error.message);
      }
    }
    return coupons;
  }

  // Get current user (mock)
  getCurrentUser() {
    return { id: 'admin1', role: 'admin' };
  }

  // Cleanup expired discounts/coupons
  cleanupExpired() {
    const now = new Date();
    let cleanedCount = 0;

    this.discounts = this.discounts.filter(discount => {
      if (discount.endDate && new Date(discount.endDate) < now) {
        cleanedCount++;
        return false;
      }
      return true;
    });

    this.coupons = this.coupons.filter(coupon => {
      if (coupon.endDate && new Date(coupon.endDate) < now) {
        cleanedCount++;
        return false;
      }
      return true;
    });

    if (cleanedCount > 0) {
      this.saveDiscounts();
      this.saveCoupons();
    }

    return cleanedCount;
  }
}

// Initialize discount manager
const DiscountManagerInstance = new DiscountManager();

// Export for global use
window.DiscountManager = DiscountManagerInstance;
