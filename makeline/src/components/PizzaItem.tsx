import React from 'react';
import './PizzaItem.css';

interface Pizza {
  productName: string;
  ingredients: string[];
  quantity?: number;
}

interface PizzaItemProps {
  pizza: Pizza;
}

const PizzaItem: React.FC<PizzaItemProps> = ({ pizza }) => {
  if (!pizza || !pizza.productName) {
    return <div className="pizza-container pizza-error">Invalid pizza data</div>;
  }
  
  const hasIngredients = Array.isArray(pizza.ingredients) && pizza.ingredients.length > 0;

  // Determine pizza type based on name and ingredients
  const getPizzaType = (name: string, ingredients: string[]): string => {
    const nameLower = name.toLowerCase();
    const ingredientsStr = ingredients.join(',').toLowerCase();
    
    if (nameLower.includes('pepperoni') || ingredientsStr.includes('pepperoni')) {
      return 'pepperoni';
    }
    
    if (nameLower.includes('cheese') && !nameLower.includes('extra cheese')) {
      return 'cheese';
    }
    
    if (nameLower.includes('hawaiian') || 
        (ingredientsStr.includes('pineapple') && ingredientsStr.includes('ham'))) {
      return 'hawaiian';
    }
    
    if (nameLower.includes('veggie') || 
        (ingredientsStr.includes('mushroom') && !ingredientsStr.includes('pepperoni') && 
         !ingredientsStr.includes('ham') && !ingredientsStr.includes('bacon'))) {
      return 'veggie';
    }
    
    if (nameLower.includes('meat') || 
        (ingredientsStr.includes('pepperoni') && ingredientsStr.includes('ham') && 
         ingredientsStr.includes('bacon'))) {
      return 'meat-lovers';
    }
    
    if (ingredients.length >= 4 || nameLower.includes('supreme')) {
      return 'supreme';
    }
    
    return '';
  };

  // Get a display name for the product
  const getDisplayName = (name: string): string => {
    // If it's a pizza, try to extract the specific type
    if (name.toLowerCase().includes('pizza')) {
      // For items like "12" Medium Pizza", just return that
      return name;
    }
    return name;
  };

  // Organize ingredients by category
  const organizeIngredients = (ingredients: string[]) => {
    if (!ingredients || ingredients.length === 0) {
      return {
        sauce: [],
        cheese: [],
        whole: [],
        left: [],
        right: []
      };
    }
    
    return ingredients.reduce((acc, ing) => {
      if (ing.startsWith('Sauce:')) {
        acc.sauce.push(ing);
      } else if (ing.startsWith('Cheese:')) {
        acc.cheese.push(ing);
      } else if (ing.startsWith('Left:')) {
        acc.left.push(ing);
      } else if (ing.startsWith('Right:')) {
        acc.right.push(ing);
      } else {
        acc.whole.push(ing);
      }
      return acc;
    }, {
      sauce: [] as string[],
      cheese: [] as string[],
      whole: [] as string[],
      left: [] as string[],
      right: [] as string[]
    });
  };

  // Format single ingredient for display
  const formatIngredient = (ing: string, type: string) => {
    // Extract clean topping name
    let cleanName = ing
      .replace(/Left: |Right: |Sauce: |Cheese: /, '')
      .trim();
    
    // Apply appropriate class based on type
    let className = `topping topping-${type} topping-${cleanName.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (type === 'left') {
      className += ' topping-left';
    } else if (type === 'right') {
      className += ' topping-right';
    } else if (type === 'sauce' || type === 'cheese') {
      className += ' topping-special';
    }
    
    return (
      <span key={ing} className={className}>
        {cleanName}
      </span>
    );
  };

  const pizzaType = getPizzaType(pizza.productName, pizza.ingredients || []);
  const displayName = getDisplayName(pizza.productName);
  const organizedIngredients = organizeIngredients(pizza.ingredients || []);

  return (
    <div className="pizza-item" data-type={pizzaType}>
      <div className="pizza-item-header">
        <h4 className="pizza-name">{displayName}</h4>
        {pizza.quantity && pizza.quantity > 1 && (
          <span className="pizza-quantity">x{pizza.quantity}</span>
        )}
      </div>
      
      {hasIngredients ? (
        <div className="pizza-ingredients-container">
          {/* Sauce section */}
          {organizedIngredients.sauce.length > 0 && (
            <div className="ingredients-section">
              <span className="ingredients-label">Sauce:</span>
              <div className="ingredients-list">
                {organizedIngredients.sauce.map(ing => formatIngredient(ing, 'sauce'))}
              </div>
            </div>
          )}
          
          {/* Cheese section */}
          {organizedIngredients.cheese.length > 0 && (
            <div className="ingredients-section">
              <span className="ingredients-label">Cheese:</span>
              <div className="ingredients-list">
                {organizedIngredients.cheese.map(ing => formatIngredient(ing, 'cheese'))}
              </div>
            </div>
          )}
          
          {/* Whole pizza toppings */}
          {organizedIngredients.whole.length > 0 && (
            <div className="ingredients-section">
              <span className="ingredients-label">Toppings:</span>
              <div className="ingredients-list">
                {organizedIngredients.whole.map(ing => formatIngredient(ing, 'whole'))}
              </div>
            </div>
          )}
          
          {/* Left side toppings */}
          {organizedIngredients.left.length > 0 && (
            <div className="ingredients-section">
              <span className="ingredients-label">Left Half:</span>
              <div className="ingredients-list">
                {organizedIngredients.left.map(ing => formatIngredient(ing, 'left'))}
              </div>
            </div>
          )}
          
          {/* Right side toppings */}
          {organizedIngredients.right.length > 0 && (
            <div className="ingredients-section">
              <span className="ingredients-label">Right Half:</span>
              <div className="ingredients-list">
                {organizedIngredients.right.map(ing => formatIngredient(ing, 'right'))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pizza-ingredients">
          <span className="no-ingredients">Plain cheese</span>
        </div>
      )}
    </div>
  );
};

export default PizzaItem;