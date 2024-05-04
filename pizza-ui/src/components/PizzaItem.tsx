import React from 'react';

interface PizzaItemProps {
  pizza: {
    productName: string;
    ingredients: string[];
  };
}

const PizzaItem: React.FC<PizzaItemProps> = ({ pizza }) => {
  return (
    <div>
      <h3>{pizza.productName}</h3>
      <ul>
        {pizza.ingredients.map((ingredient, index) => (
          <li key={index}>{ingredient}</li>
        ))}
      </ul>
    </div>
  );
};

export default PizzaItem;
