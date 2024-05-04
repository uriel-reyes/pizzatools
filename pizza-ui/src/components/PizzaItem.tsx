import React from 'react';
import './PizzaItem.css'; // Make sure CSS is correctly imported

interface Pizza {
  productName: string;
  ingredients: string[];
}

interface PizzaItemProps {
  pizza: Pizza;
}

const PizzaItem: React.FC<PizzaItemProps> = ({ pizza }) => {
  return (
    <div className="pizza-container">
      <h3>{pizza.productName}</h3>
      <ul className="ingredients-list">
        {pizza.ingredients.map((ingredient, index) => (
          <li key={index}>{ingredient}</li>
        ))}
      </ul>
    </div>
  );
};

export default PizzaItem;
